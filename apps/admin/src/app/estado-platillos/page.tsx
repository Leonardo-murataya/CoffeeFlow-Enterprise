import { ThemeToggle } from "@coffeeflow/ui";
import OrdersRealtime from "../OrdersRealtime";
import {
    AdminButton,
    AdminShell,
    FieldLabel,
    Panel,
    ToneChip,
} from "../components/admin-ui";
import {
    createCategoryAction,
    createProductAction,
    deleteCategoryAction,
    deleteProductAction,
    restockCriticalAction,
    syncRecipeAction,
    toggleProductActiveAction,
    updateCategoryAction,
    updateInventoryAction,
    updateProductPriceAction,
} from "../actions";
import {
    buildCategoryMap,
    formatMoneyMXN,
    loadAdminSnapshot,
} from "../lib/admin-data";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function EstadoPlatillosPage() {
    const snapshot = await loadAdminSnapshot();
    const categoryMap = buildCategoryMap(snapshot.categories);
    const activeProducts = snapshot.products.filter(
        (product) => product.is_active,
    );
    const hiddenProducts = snapshot.products.length - activeProducts.length;
    const lowStockItems = snapshot.inventory.filter(
        (item) => item.current_quantity < item.minimum_quantity,
    );

    return (
        <AdminShell
            activeHref="/estado-platillos"
            eyebrow="Gestión de catálogo"
            title="Menú e inventario"
            description="Control de platillos, precios, categorías, stock y recetas desde una sola vista práctica."
            headerActions={<ThemeToggle />}
            summary={
                <div className="space-y-2">
                    <p className="text-sm font-semibold text-slate-900">
                        {snapshot.products.length} platillos ·{" "}
                        {snapshot.categories.length} categorías
                    </p>
                    <p className="text-sm text-slate-600">
                        {activeProducts.length} activos · {hiddenProducts}{" "}
                        ocultos · {lowStockItems.length} insumos críticos
                    </p>
                </div>
            }
        >
            <OrdersRealtime />

            <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
                <Panel
                    title="Crear y ajustar menú"
                    subtitle="Alta de productos, cambio de precio y activación o cierre del catálogo."
                >
                    <form
                        action={createProductAction}
                        className="space-y-4 rounded-3xl border border-slate-200 bg-slate-50 p-4"
                    >
                        <h3 className="text-sm font-semibold text-slate-900">
                            Nuevo platillo
                        </h3>
                        <div className="grid gap-3 md:grid-cols-2">
                            <div>
                                <FieldLabel htmlFor="product-name">
                                    Nombre
                                </FieldLabel>
                                <input
                                    id="product-name"
                                    name="name"
                                    placeholder="Flat white"
                                    className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
                                />
                            </div>
                            <div>
                                <FieldLabel htmlFor="product-price">
                                    Precio MXN
                                </FieldLabel>
                                <input
                                    id="product-price"
                                    name="price"
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    placeholder="0.00"
                                    className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
                                />
                            </div>
                        </div>
                        <div>
                            <FieldLabel htmlFor="product-category">
                                Categoría
                            </FieldLabel>
                            <select
                                id="product-category"
                                name="categoryId"
                                defaultValue={snapshot.categories[0]?.id ?? ""}
                                className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
                            >
                                {snapshot.categories.map((category) => (
                                    <option
                                        key={category.id}
                                        value={category.id}
                                    >
                                        {category.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <AdminButton type="submit">Crear producto</AdminButton>
                    </form>

                    <div className="mt-5 max-h-[600px] overflow-y-auto pr-2 space-y-4">
                        {snapshot.products.map((product) => (
                            <article
                                key={product.id}
                                className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm"
                            >
                                <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                                    <div>
                                        <p className="text-sm font-semibold text-slate-950">
                                            {product.name}
                                        </p>
                                        <p className="text-xs uppercase tracking-[0.24em] text-slate-500">
                                            {categoryMap.get(
                                                product.category_id ?? "",
                                            ) ?? "Sin categoría"}
                                        </p>
                                        <p className="mt-2 text-sm text-slate-600">
                                            {product.description ??
                                                "Sin descripción registrada."}
                                        </p>
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                        <ToneChip
                                            tone={
                                                product.is_active
                                                    ? "emerald"
                                                    : "slate"
                                            }
                                        >
                                            {product.is_active
                                                ? "Activo"
                                                : "Oculto"}
                                        </ToneChip>
                                        <ToneChip tone="sky">
                                            {formatMoneyMXN(
                                                product.price_cents,
                                            )}
                                        </ToneChip>
                                    </div>
                                </div>

                                <div className="mt-4 grid gap-3 lg:grid-cols-[1fr_1fr_1fr]">
                                    <form
                                        action={updateProductPriceAction}
                                        className="space-y-2"
                                    >
                                        <input
                                            type="hidden"
                                            name="productId"
                                            value={product.id}
                                        />
                                        <FieldLabel
                                            htmlFor={`price-${product.id}`}
                                        >
                                            Nuevo precio
                                        </FieldLabel>
                                        <input
                                            id={`price-${product.id}`}
                                            name="price"
                                            type="number"
                                            min="0"
                                            step="0.01"
                                            defaultValue={(
                                                product.price_cents / 100
                                            ).toFixed(2)}
                                            className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
                                        />
                                        <AdminButton
                                            type="submit"
                                            variant="secondary"
                                            className="w-full"
                                        >
                                            Guardar precio
                                        </AdminButton>
                                    </form>
                                    <form
                                        action={toggleProductActiveAction}
                                        className="space-y-2"
                                    >
                                        <input
                                            type="hidden"
                                            name="productId"
                                            value={product.id}
                                        />
                                        <FieldLabel
                                            htmlFor={`active-${product.id}`}
                                        >
                                            Estado
                                        </FieldLabel>
                                        <select
                                            id={`active-${product.id}`}
                                            name="isActive"
                                            defaultValue={String(
                                                product.is_active,
                                            )}
                                            className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
                                        >
                                            <option value="true">Activo</option>
                                            <option value="false">
                                                Oculto
                                            </option>
                                        </select>
                                        <AdminButton
                                            type="submit"
                                            variant="secondary"
                                            className="w-full"
                                        >
                                            Guardar estado
                                        </AdminButton>
                                    </form>
                                    <form
                                        action={deleteProductAction}
                                        className="space-y-2 flex flex-col justify-end"
                                    >
                                        <input
                                            type="hidden"
                                            name="productId"
                                            value={product.id}
                                        />
                                        <FieldLabel>Acción</FieldLabel>
                                        <AdminButton
                                            type="submit"
                                            variant="secondary"
                                            className="w-full bg-rose-50 hover:bg-rose-100 text-rose-700 border-rose-200"
                                        >
                                            Eliminar platillo
                                        </AdminButton>
                                    </form>
                                </div>
                            </article>
                        ))}
                    </div>
                </Panel>

                <Panel
                    title="Categorías y recetas"
                    subtitle="Mantén el menú limpio y las relaciones de insumos al día."
                >
                    <form
                        action={createCategoryAction}
                        className="space-y-3 rounded-3xl border border-slate-200 bg-slate-50 p-4"
                    >
                        <h3 className="text-sm font-semibold text-slate-900">
                            Nueva categoría
                        </h3>
                        <div>
                            <FieldLabel htmlFor="category-name">
                                Nombre
                            </FieldLabel>
                            <input
                                id="category-name"
                                name="name"
                                placeholder="Bebidas frías"
                                className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
                            />
                        </div>
                        <AdminButton type="submit" variant="secondary">
                            Crear categoría
                        </AdminButton>
                    </form>

                    <div className="mt-5 max-h-[300px] overflow-y-auto pr-2 space-y-3">
                        {snapshot.categories.map((category) => (
                            <article
                                key={category.id}
                                className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm"
                            >
                                <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
                                    <form
                                        action={updateCategoryAction}
                                        className="flex-1 space-y-2"
                                    >
                                        <input
                                            type="hidden"
                                            name="categoryId"
                                            value={category.id}
                                        />
                                        <FieldLabel
                                            htmlFor={`category-${category.id}`}
                                        >
                                            Categoría
                                        </FieldLabel>
                                        <input
                                            id={`category-${category.id}`}
                                            name="name"
                                            defaultValue={category.name}
                                            className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
                                        />
                                        <AdminButton
                                            type="submit"
                                            variant="secondary"
                                        >
                                            Guardar nombre
                                        </AdminButton>
                                    </form>
                                    <form action={deleteCategoryAction}>
                                        <input
                                            type="hidden"
                                            name="categoryId"
                                            value={category.id}
                                        />
                                        <AdminButton
                                            type="submit"
                                            variant="secondary"
                                        >
                                            Eliminar
                                        </AdminButton>
                                    </form>
                                </div>
                            </article>
                        ))}
                    </div>

                    <form
                        action={syncRecipeAction}
                        className="mt-5 space-y-4 rounded-3xl border border-slate-200 bg-slate-50 p-4"
                    >
                        <h3 className="text-sm font-semibold text-slate-900">
                            Relacionar receta
                        </h3>
                        <div className="grid gap-3 md:grid-cols-2">
                            <div>
                                <FieldLabel htmlFor="recipe-product">
                                    Platillo
                                </FieldLabel>
                                <select
                                    id="recipe-product"
                                    name="productId"
                                    defaultValue={
                                        snapshot.products[0]?.id ?? ""
                                    }
                                    className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
                                >
                                    {snapshot.products.map((product) => (
                                        <option
                                            key={product.id}
                                            value={product.id}
                                        >
                                            {product.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <FieldLabel htmlFor="recipe-item">
                                    Insumo
                                </FieldLabel>
                                <select
                                    id="recipe-item"
                                    name="inventoryItemId"
                                    defaultValue={
                                        snapshot.inventory[0]?.id ?? ""
                                    }
                                    className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
                                >
                                    {snapshot.inventory.map((item) => (
                                        <option key={item.id} value={item.id}>
                                            {item.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>
                        <div>
                            <FieldLabel htmlFor="recipe-quantity">
                                Cantidad usada
                            </FieldLabel>
                            <input
                                id="recipe-quantity"
                                name="quantityUsed"
                                type="number"
                                min="0.001"
                                step="0.001"
                                defaultValue="1"
                                className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
                            />
                        </div>
                        <AdminButton type="submit" variant="secondary">
                            Guardar receta
                        </AdminButton>
                    </form>
                </Panel>
            </div>

            <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
                <Panel
                    title="Inventario"
                    subtitle="Ajusta existencias y mínimos por insumo."
                >
                    <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2">
                        {snapshot.inventory.map((item) => {
                            const shortage = Math.max(
                                0,
                                item.minimum_quantity - item.current_quantity,
                            );

                            return (
                                <article
                                    key={item.id}
                                    className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm"
                                >
                                    <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                                        <div>
                                            <p className="text-sm font-semibold text-slate-950">
                                                {item.name}
                                            </p>
                                            <p className="text-sm text-slate-500">
                                                {item.unit} · actual{" "}
                                                {item.current_quantity} · mínimo{" "}
                                                {item.minimum_quantity}
                                            </p>
                                        </div>
                                        <ToneChip
                                            tone={
                                                shortage > 0
                                                    ? "rose"
                                                    : "emerald"
                                            }
                                        >
                                            {shortage > 0
                                                ? `Falta ${shortage.toFixed(1)} ${item.unit}`
                                                : "OK"}
                                        </ToneChip>
                                    </div>

                                    <form
                                        action={updateInventoryAction}
                                        className="mt-4 grid gap-3 md:grid-cols-[1fr_1fr_auto]"
                                    >
                                        <input
                                            type="hidden"
                                            name="inventoryItemId"
                                            value={item.id}
                                        />
                                        <div>
                                            <FieldLabel
                                                htmlFor={`current-${item.id}`}
                                            >
                                                Existencia actual
                                            </FieldLabel>
                                            <input
                                                id={`current-${item.id}`}
                                                name="currentQuantity"
                                                type="number"
                                                step="0.1"
                                                min="0"
                                                defaultValue={
                                                    item.current_quantity
                                                }
                                                className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
                                            />
                                        </div>
                                        <div>
                                            <FieldLabel
                                                htmlFor={`minimum-${item.id}`}
                                            >
                                                Mínimo operativo
                                            </FieldLabel>
                                            <input
                                                id={`minimum-${item.id}`}
                                                name="minimumQuantity"
                                                type="number"
                                                step="0.1"
                                                min="0"
                                                defaultValue={
                                                    item.minimum_quantity
                                                }
                                                className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
                                            />
                                        </div>
                                        <div className="flex items-end">
                                            <AdminButton
                                                type="submit"
                                                variant="secondary"
                                            >
                                                Guardar
                                            </AdminButton>
                                        </div>
                                    </form>
                                </article>
                            );
                        })}
                    </div>

                    <form action={restockCriticalAction} className="mt-5">
                        <AdminButton type="submit">
                            Reabastecer críticos
                        </AdminButton>
                    </form>
                </Panel>

                <Panel
                    title="Estado del menú"
                    subtitle="Checklist rápido para detectar catálogo activo, oculto y bien categorizado."
                >
                    <div className="space-y-3 text-sm text-slate-700 max-h-[500px] overflow-y-auto pr-2">
                        {snapshot.products.map((product) => (
                            <div
                                key={product.id}
                                className="flex items-center justify-between rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3"
                            >
                                <div>
                                    <p className="font-semibold text-slate-950">
                                        {product.name}
                                    </p>
                                    <p className="text-slate-500">
                                        {categoryMap.get(
                                            product.category_id ?? "",
                                        ) ?? "Sin categoría"}
                                    </p>
                                </div>
                                <div className="text-right">
                                    <p className="font-semibold text-slate-950">
                                        {formatMoneyMXN(product.price_cents)}
                                    </p>
                                    <ToneChip
                                        tone={
                                            product.is_active
                                                ? "emerald"
                                                : "slate"
                                        }
                                    >
                                        {product.is_active
                                            ? "Activo"
                                            : "Oculto"}
                                    </ToneChip>
                                </div>
                            </div>
                        ))}
                    </div>
                </Panel>
            </div>
        </AdminShell>
    );
}
