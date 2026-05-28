"use server";

import { createSupabaseServiceClient } from "@coffeeflow/database";
import { revalidatePath } from "next/cache";

export async function createProductAction(formData: FormData) {
    const name = String(formData.get("name") ?? "").trim();
    const priceValue = Number(String(formData.get("price") ?? "0"));
    const categoryId = String(formData.get("categoryId") ?? "").trim() || null;

    if (!name || !Number.isFinite(priceValue) || priceValue <= 0) {
        return;
    }

    const client = createSupabaseServiceClient();

    const { error } = await client.from("products").insert({
        name,
        description: null,
        price_cents: Math.round(priceValue * 100),
        category_id: categoryId,
        is_active: true,
    });

    if (error) {
        throw error;
    }

    revalidatePath("/");
    revalidatePath("/estado-platillos");
}

export async function createCategoryAction(formData: FormData) {
    const name = String(formData.get("name") ?? "").trim();

    if (!name) {
        return;
    }

    const client = createSupabaseServiceClient();
    const { error } = await client.from("product_categories").insert({ name });

    if (error) {
        throw error;
    }

    revalidatePath("/");
    revalidatePath("/estado-platillos");
}

export async function updateCategoryAction(formData: FormData) {
    const categoryId = String(formData.get("categoryId") ?? "").trim();
    const name = String(formData.get("name") ?? "").trim();

    if (!categoryId || !name) {
        return;
    }

    const client = createSupabaseServiceClient();
    const { error } = await client
        .from("product_categories")
        .update({ name })
        .eq("id", categoryId);

    if (error) {
        throw error;
    }

    revalidatePath("/");
    revalidatePath("/estado-platillos");
}

export async function deleteCategoryAction(formData: FormData) {
    const categoryId = String(formData.get("categoryId") ?? "").trim();

    if (!categoryId) {
        return;
    }

    const client = createSupabaseServiceClient();
    const { error } = await client
        .from("product_categories")
        .delete()
        .eq("id", categoryId);

    if (error) {
        throw error;
    }

    revalidatePath("/");
    revalidatePath("/estado-platillos");
}

export async function updateProductPriceAction(formData: FormData) {
    const productId = String(formData.get("productId") ?? "").trim();
    const priceValue = Number(String(formData.get("price") ?? "0"));

    if (!productId || !Number.isFinite(priceValue) || priceValue <= 0) {
        return;
    }

    const client = createSupabaseServiceClient();

    const { error } = await client
        .from("products")
        .update({ price_cents: Math.round(priceValue * 100) })
        .eq("id", productId);

    if (error) {
        throw error;
    }

    revalidatePath("/");
    revalidatePath("/estado-platillos");
}

export async function toggleProductActiveAction(formData: FormData) {
    const productId = String(formData.get("productId") ?? "").trim();
    const isActiveValue = String(formData.get("isActive") ?? "").trim();

    if (!productId || (isActiveValue !== "true" && isActiveValue !== "false")) {
        return;
    }

    const client = createSupabaseServiceClient();

    const { error } = await client
        .from("products")
        .update({ is_active: isActiveValue === "true" })
        .eq("id", productId);

    if (error) {
        throw error;
    }

    revalidatePath("/");
    revalidatePath("/estado-platillos");
}

export async function updateInventoryAction(formData: FormData) {
    const inventoryItemId = String(
        formData.get("inventoryItemId") ?? "",
    ).trim();
    const currentQuantity = Number(
        String(formData.get("currentQuantity") ?? "0"),
    );
    const minimumQuantity = Number(
        String(formData.get("minimumQuantity") ?? "0"),
    );

    if (
        !inventoryItemId ||
        !Number.isFinite(currentQuantity) ||
        !Number.isFinite(minimumQuantity) ||
        currentQuantity < 0 ||
        minimumQuantity < 0
    ) {
        return;
    }

    const client = createSupabaseServiceClient();

    const { error } = await client
        .from("inventory_items")
        .update({
            current_quantity: currentQuantity,
            minimum_quantity: minimumQuantity,
        })
        .eq("id", inventoryItemId);

    if (error) {
        throw error;
    }

    revalidatePath("/");
    revalidatePath("/estado-platillos");
}

export async function syncRecipeAction(formData: FormData) {
    const productId = String(formData.get("productId") ?? "").trim();
    const inventoryItemId = String(
        formData.get("inventoryItemId") ?? "",
    ).trim();
    const quantityUsed = Number(String(formData.get("quantityUsed") ?? "1"));

    if (
        !productId ||
        !inventoryItemId ||
        !Number.isFinite(quantityUsed) ||
        quantityUsed <= 0
    ) {
        return;
    }

    const client = createSupabaseServiceClient();

    const { error } = await client.from("recipes").upsert(
        {
            product_id: productId,
            inventory_item_id: inventoryItemId,
            quantity_used: quantityUsed,
        },
        {
            onConflict: "product_id,inventory_item_id",
        },
    );

    if (error) {
        throw error;
    }

    revalidatePath("/");
    revalidatePath("/estado-platillos");
}

export async function restockCriticalAction() {
    const client = createSupabaseServiceClient();

    const { data: inventoryItems, error } = await client
        .from("inventory_items")
        .select("id, current_quantity, minimum_quantity");

    if (error) {
        throw error;
    }

    const updates = (inventoryItems ?? [])
        .filter((item) => item.current_quantity < item.minimum_quantity)
        .map((item) =>
            client
                .from("inventory_items")
                .update({ current_quantity: item.minimum_quantity + 10 })
                .eq("id", item.id),
        );

    await Promise.all(updates);
    revalidatePath("/");
    revalidatePath("/estado-platillos");
}

export async function deleteProductAction(formData: FormData) {
    const productId = String(formData.get("productId") ?? "").trim();

    if (!productId) {
        return;
    }

    const client = createSupabaseServiceClient();

    // First delete any recipe associated with this product
    await client.from("recipes").delete().eq("product_id", productId);

    // Try to delete the product
    const { error: deleteError } = await client
        .from("products")
        .delete()
        .eq("id", productId);

    if (deleteError) {
        // If it cannot be deleted because of ordered items (on delete restrict),
        // we soft-delete it by setting is_active to false.
        const { error: updateError } = await client
            .from("products")
            .update({ is_active: false })
            .eq("id", productId);

        if (updateError) {
            throw updateError;
        }
    }

    revalidatePath("/");
    revalidatePath("/estado-platillos");
}
