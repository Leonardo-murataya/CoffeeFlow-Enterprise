import {
    createSupabaseServiceClient,
    ensureDemoData,
} from "@coffeeflow/database";

export type InventoryRow = {
    id: string;
    name: string;
    unit: string;
    current_quantity: number;
    minimum_quantity: number;
};

export type ProductRow = {
    id: string;
    name: string;
    description: string | null;
    price_cents: number;
    category_id: string | null;
    is_active: boolean;
};

export type CategoryRow = {
    id: string;
    name: string;
};

export type OrderRow = {
    id: string;
    status: "pending" | "in_progress" | "ready" | "served" | "cancelled";
    total_cents: number;
    created_at: string;
    notes: string | null;
};

export type OrderItemRow = {
    order_id: string;
    quantity: number;
    line_total_cents: number;
    product_id: string;
};

export type AdminSnapshot = {
    inventory: InventoryRow[];
    products: ProductRow[];
    categories: CategoryRow[];
    orders: OrderRow[];
    orderItems: OrderItemRow[];
};

export type DishStatusTone = "slate" | "amber" | "sky" | "emerald" | "rose";

export type DishStatusRow = {
    id: string;
    name: string;
    category: string;
    statusLabel: string;
    tone: DishStatusTone;
    activeOrders: number;
    lastActivityAt: string | null;
    subtotalText: string;
    progressPercent: number;
};

export type OrderStatusSummaryRow = {
    status: OrderRow["status"];
    label: string;
    count: number;
    tone: DishStatusTone;
};

export type ProductSalesRow = {
    id: string;
    name: string;
    category: string;
    quantity: number;
    revenueCents: number;
    revenueText: string;
    orders: number;
};

export type RecentOrderRow = OrderRow & {
    itemCount: number;
    summary: string;
};

export type PreparationTicketItem = {
    productId: string;
    name: string;
    quantity: number;
    lineTotalText: string;
};

export type PreparationTicketRow = {
    id: string;
    status: "in_progress";
    createdAt: string;
    totalText: string;
    notes: string | null;
    items: PreparationTicketItem[];
};

export async function loadAdminSnapshot(): Promise<AdminSnapshot> {
    const client = createSupabaseServiceClient();

    await ensureDemoData(client);

    const [
        inventoryResult,
        productsResult,
        categoriesResult,
        ordersResult,
        orderItemsResult,
    ] = await Promise.all([
        client
            .from("inventory_items")
            .select("id, name, unit, current_quantity, minimum_quantity")
            .order("name", { ascending: true }),
        client
            .from("products")
            .select(
                "id, name, description, price_cents, category_id, is_active",
            )
            .order("name", { ascending: true }),
        client
            .from("product_categories")
            .select("id, name")
            .order("name", { ascending: true }),
        client
            .from("orders")
            .select("id, status, total_cents, created_at, notes")
            .order("created_at", { ascending: false })
            .limit(10),
        client
            .from("order_items")
            .select("order_id, quantity, line_total_cents, product_id"),
    ]);

    if (inventoryResult.error) {
        throw inventoryResult.error;
    }

    if (productsResult.error) {
        throw productsResult.error;
    }

    if (categoriesResult.error) {
        throw categoriesResult.error;
    }

    if (ordersResult.error) {
        throw ordersResult.error;
    }

    if (orderItemsResult.error) {
        throw orderItemsResult.error;
    }

    return {
        inventory: (inventoryResult.data ?? []) as InventoryRow[],
        products: (productsResult.data ?? []) as ProductRow[],
        categories: (categoriesResult.data ?? []) as CategoryRow[],
        orders: (ordersResult.data ?? []) as OrderRow[],
        orderItems: (orderItemsResult.data ?? []) as OrderItemRow[],
    };
}

export function buildCategoryMap(categories: CategoryRow[]) {
    return new Map(categories.map((category) => [category.id, category.name]));
}

export function buildOrderItemMap(orderItems: OrderItemRow[]) {
    const orderItemsByOrder = new Map<string, OrderItemRow[]>();

    for (const item of orderItems) {
        const list = orderItemsByOrder.get(item.order_id) ?? [];
        list.push(item);
        orderItemsByOrder.set(item.order_id, list);
    }

    return orderItemsByOrder;
}

export function buildProductNameMap(
    products: Pick<ProductRow, "id" | "name">[],
) {
    return new Map(products.map((product) => [product.id, product.name]));
}

export function formatMoneyMXN(amountCents: number) {
    return new Intl.NumberFormat("es-MX", {
        style: "currency",
        currency: "MXN",
    }).format(amountCents / 100);
}

export function isSameLocalDay(isoDate: string, referenceDate = new Date()) {
    const date = new Date(isoDate);

    return (
        date.getFullYear() === referenceDate.getFullYear() &&
        date.getMonth() === referenceDate.getMonth() &&
        date.getDate() === referenceDate.getDate()
    );
}

export function buildOrderStatusSummary(
    snapshot: AdminSnapshot,
    referenceDate = new Date(),
): OrderStatusSummaryRow[] {
    const todayOrders = snapshot.orders.filter((order) =>
        isSameLocalDay(order.created_at, referenceDate),
    );
    const statuses = [
        "pending",
        "in_progress",
        "ready",
        "served",
        "cancelled",
    ] as const;

    const labels: Record<OrderRow["status"], string> = {
        pending: "Pendientes",
        in_progress: "En preparación",
        ready: "Listos",
        served: "Entregados",
        cancelled: "Cancelados",
    };

    const tones: Record<OrderRow["status"], DishStatusTone> = {
        pending: "amber",
        in_progress: "sky",
        ready: "emerald",
        served: "emerald",
        cancelled: "rose",
    };

    return statuses.map((status) => ({
        status,
        label: labels[status],
        count: todayOrders.filter((order) => order.status === status).length,
        tone: tones[status],
    }));
}

export function buildTopProductsToday(
    snapshot: AdminSnapshot,
    limit = 5,
    referenceDate = new Date(),
): ProductSalesRow[] {
    const orderById = new Map(
        snapshot.orders.map((order) => [order.id, order]),
    );
    const productById = new Map(
        snapshot.products.map((product) => [product.id, product]),
    );
    const categoryById = buildCategoryMap(snapshot.categories);
    const aggregate = new Map<
        string,
        { quantity: number; revenueCents: number; orderIds: Set<string> }
    >();

    for (const item of snapshot.orderItems) {
        const order = orderById.get(item.order_id);

        if (!order || !isSameLocalDay(order.created_at, referenceDate)) {
            continue;
        }

        const current = aggregate.get(item.product_id) ?? {
            quantity: 0,
            revenueCents: 0,
            orderIds: new Set<string>(),
        };

        current.quantity += item.quantity;
        current.revenueCents += item.line_total_cents;
        current.orderIds.add(item.order_id);
        aggregate.set(item.product_id, current);
    }

    return [...aggregate.entries()]
        .map(([productId, data]) => {
            const product = productById.get(productId);

            return {
                id: productId,
                name: product?.name ?? "Producto",
                category:
                    categoryById.get(product?.category_id ?? "") ??
                    "Sin categoría",
                quantity: data.quantity,
                revenueCents: data.revenueCents,
                revenueText: formatMoneyMXN(data.revenueCents),
                orders: data.orderIds.size,
            };
        })
        .sort((left, right) => {
            if (right.quantity !== left.quantity) {
                return right.quantity - left.quantity;
            }

            return right.revenueCents - left.revenueCents;
        })
        .slice(0, limit);
}

export function buildRecentOrders(
    snapshot: AdminSnapshot,
    limit = 6,
): RecentOrderRow[] {
    const productNameMap = buildProductNameMap(snapshot.products);

    return snapshot.orders.slice(0, limit).map((order) => {
        const items = snapshot.orderItems.filter(
            (item) => item.order_id === order.id,
        );

        return {
            ...order,
            itemCount: items.reduce((sum, item) => sum + item.quantity, 0),
            summary: items
                .slice(0, 3)
                .map(
                    (item) =>
                        `${item.quantity}× ${productNameMap.get(item.product_id) ?? "Producto"}`,
                )
                .join(", "),
        };
    });
}

export function buildDishStatuses(snapshot: AdminSnapshot): DishStatusRow[] {
    const orderById = new Map(
        snapshot.orders.map((order) => [order.id, order]),
    );
    const categoryMap = buildCategoryMap(snapshot.categories);
    const orderItemsByProduct = new Map<string, OrderItemRow[]>();

    for (const item of snapshot.orderItems) {
        const list = orderItemsByProduct.get(item.product_id) ?? [];
        list.push(item);
        orderItemsByProduct.set(item.product_id, list);
    }

    return snapshot.products.map((product) => {
        const relatedItems = (orderItemsByProduct.get(product.id) ?? [])
            .map((item) => ({
                item,
                order: orderById.get(item.order_id),
            }))
            .filter((entry) => Boolean(entry.order))
            .sort((left, right) => {
                const leftTime = new Date(left.order!.created_at).getTime();
                const rightTime = new Date(right.order!.created_at).getTime();
                return rightTime - leftTime;
            });

        const latest = relatedItems[0]?.order ?? null;
        const activeOrders = relatedItems.length;
        const readyCount = relatedItems.filter(
            (entry) =>
                entry.order?.status === "ready" ||
                entry.order?.status === "served",
        ).length;

        let statusLabel = "Disponible";
        let tone: DishStatusTone = "slate";

        if (latest) {
            if (latest.status === "pending") {
                statusLabel = "Pendiente";
                tone = "amber";
            } else if (latest.status === "in_progress") {
                statusLabel = "En preparación";
                tone = "sky";
            } else if (latest.status === "ready") {
                statusLabel = "Listo";
                tone = "emerald";
            } else if (latest.status === "served") {
                statusLabel = "Entregado";
                tone = "emerald";
            } else if (latest.status === "cancelled") {
                statusLabel = "Cancelado";
                tone = "rose";
            }
        }

        return {
            id: product.id,
            name: product.name,
            category:
                categoryMap.get(product.category_id ?? "") ?? "Sin categoría",
            statusLabel,
            tone,
            activeOrders,
            lastActivityAt: latest?.created_at ?? null,
            subtotalText:
                activeOrders > 0
                    ? `${activeOrders} movimientos`
                    : "Sin actividad",
            progressPercent:
                activeOrders === 0
                    ? 0
                    : Math.min(
                          100,
                          Math.round((readyCount / activeOrders) * 100),
                      ),
        };
    });
}

export function buildPreparationTickets(
    snapshot: AdminSnapshot,
): PreparationTicketRow[] {
    const productNameMap = buildProductNameMap(snapshot.products);

    return snapshot.orders
        .filter((order) => order.status === "in_progress")
        .map((order) => {
            const items = snapshot.orderItems
                .filter((item) => item.order_id === order.id)
                .map((item) => ({
                    productId: item.product_id,
                    name: productNameMap.get(item.product_id) ?? "Producto",
                    quantity: item.quantity,
                    lineTotalText: formatMoneyMXN(item.line_total_cents),
                }));

            return {
                id: order.id,
                status: "in_progress" as const,
                createdAt: order.created_at,
                totalText: formatMoneyMXN(order.total_cents),
                notes: order.notes,
                items,
            };
        });
}
