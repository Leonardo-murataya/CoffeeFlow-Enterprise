import {
    createSupabaseServiceClient,
    ensureDemoData,
} from "@coffeeflow/database";
import { StatusPill, ThemeToggle } from "@coffeeflow/ui";
import OrdersRealtime from "./OrdersRealtime";
import { updateOrderStatusAction } from "./actions";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type OrderRow = {
    id: string;
    status: "pending" | "in_progress" | "ready" | "served" | "cancelled";
    total_cents: number;
    created_at: string;
    notes: string | null;
};

type OrderItemRow = {
    order_id: string;
    quantity: number;
    line_total_cents: number;
    product_id: string;
};

type ProductRow = {
    id: string;
    name: string;
};

const money = new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
});

const statusColumns = [
    {
        key: "pending",
        title: "Pendiente",
        accent: "amber",
        surface: "bg-amber-50/80",
    },
    {
        key: "in_progress",
        title: "En preparación",
        accent: "sky",
        surface: "bg-sky-50/80",
    },
    {
        key: "ready",
        title: "Listo",
        accent: "emerald",
        surface: "bg-emerald-50/80",
    },
] as const;

const nextStatusByCurrent: Record<
    OrderRow["status"],
    OrderRow["status"] | null
> = {
    pending: "in_progress",
    in_progress: "ready",
    // En KDS la columna 'Listo' no debe marcar el pedido como entregado.
    // La cocina solo marca cuando el pedido pasa a 'ready'. La entrega
    // la marca otro rol desde la pantalla de entrega.
    ready: null,
    served: null,
    cancelled: null,
};

export default async function Home() {
    const client = createSupabaseServiceClient();

    await ensureDemoData(client);

    const [
        { data: ordersData },
        { data: orderItemsData },
        { data: productsData },
    ] = await Promise.all([
        client
            .from("orders")
            .select("id, status, total_cents, created_at, notes")
            .order("created_at", { ascending: false })
            .limit(18),
        client
            .from("order_items")
            .select("order_id, quantity, line_total_cents, product_id"),
        client.from("products").select("id, name"),
    ]);

    const orders = (ordersData ?? []) as OrderRow[];
    const orderItems = (orderItemsData ?? []) as OrderItemRow[];
    const products = (productsData ?? []) as ProductRow[];
    const pendingCount = orders.filter(
        (order) => order.status === "pending",
    ).length;
    const inProgressCount = orders.filter(
        (order) => order.status === "in_progress",
    ).length;
    const readyCount = orders.filter(
        (order) => order.status === "ready",
    ).length;

    const orderItemsByOrder = new Map<string, OrderItemRow[]>();
    for (const item of orderItems) {
        const list = orderItemsByOrder.get(item.order_id) ?? [];
        list.push(item);
        orderItemsByOrder.set(item.order_id, list);
    }

    const productMap = new Map(
        products.map((product) => [product.id, product.name]),
    );

    return (
        <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(14,165,233,0.08),transparent_22%),radial-gradient(circle_at_top_right,rgba(16,185,129,0.06),transparent_18%),linear-gradient(180deg,#ffffff_0%,#f8fafc_100%)] px-4 py-6 text-slate-950 md:px-8 md:py-8">
            <section className="mx-auto flex max-w-7xl flex-col gap-6">
                <OrdersRealtime />
                <header className="rounded-4xl border border-slate-200/80 bg-white/90 p-5 shadow-[0_18px_60px_rgba(15,23,42,0.08)] backdrop-blur md:p-6">
                    <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
                        <div className="space-y-3">
                            <div className="inline-flex rounded-full bg-slate-950 px-3 py-1 text-xs font-semibold uppercase tracking-[0.32em] text-white">
                                CoffeeFlow KDS
                            </div>
                            <div className="space-y-2">
                                <p className="text-sm font-medium uppercase tracking-[0.28em] text-sky-700">
                                    Cocina y barra
                                </p>
                                <h1 className="max-w-3xl text-3xl font-semibold tracking-tight text-slate-950 md:text-5xl">
                                    Pantalla de cocina
                                </h1>
                                <p className="max-w-3xl text-sm leading-6 text-slate-600 md:text-base">
                                    Las órdenes nuevas aparecen aquí en tiempo
                                    real para que baristas y cocina trabajen con
                                    prioridad, tiempos y alertas claras.
                                </p>
                            </div>
                        </div>

                        <div className="grid gap-3 rounded-3xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700 shadow-sm md:min-w-80 md:grid-cols-3">
                            <div className="md:col-span-3 flex justify-end">
                                <ThemeToggle />
                            </div>
                            <div>
                                <p className="text-xs uppercase tracking-[0.24em] text-slate-500">
                                    Pendientes
                                </p>
                                <p className="mt-1 text-2xl font-semibold text-slate-950">
                                    {pendingCount}
                                </p>
                            </div>
                            <div>
                                <p className="text-xs uppercase tracking-[0.24em] text-slate-500">
                                    En preparación
                                </p>
                                <p className="mt-1 text-2xl font-semibold text-slate-950">
                                    {inProgressCount}
                                </p>
                            </div>
                            <div>
                                <p className="text-xs uppercase tracking-[0.24em] text-slate-500">
                                    Listos
                                </p>
                                <p className="mt-1 text-2xl font-semibold text-slate-950">
                                    {readyCount}
                                </p>
                            </div>
                        </div>
                    </div>
                </header>

                <div className="grid gap-4 lg:grid-cols-3">
                    {statusColumns.map((column) => {
                        const columnOrders = orders.filter(
                            (order) => order.status === column.key,
                        );

                        return (
                            <section
                                key={column.title}
                                className={`rounded-4xl border border-slate-200 p-5 shadow-sm hover:-translate-y-0.5 ${column.surface}`}
                            >
                                <div className="mb-4 flex items-center justify-between gap-3">
                                    <h2 className="text-lg font-semibold text-slate-950">
                                        {column.title}
                                    </h2>
                                    <StatusPill
                                        tone={column.accent}
                                        label={String(columnOrders.length)}
                                    />
                                </div>
                                <div className="space-y-3">
                                    {columnOrders.length === 0 ? (
                                        <p className="rounded-2xl border border-dashed border-slate-200 bg-white p-4 text-sm text-slate-500">
                                            Sin tickets en esta columna.
                                        </p>
                                    ) : (
                                        columnOrders.map((order) => {
                                            const nextStatus =
                                                nextStatusByCurrent[
                                                    order.status
                                                ];

                                            return (
                                                <article
                                                    key={order.id}
                                                    className="rounded-3xl border border-slate-200 bg-white p-4 text-slate-700 shadow-sm hover:-translate-y-0.5"
                                                >
                                                    <div className="flex items-start justify-between gap-3">
                                                        <div>
                                                            <p className="font-semibold text-slate-950">
                                                                {order.id.slice(
                                                                    0,
                                                                    8,
                                                                )}
                                                            </p>
                                                            <p className="text-sm text-slate-500">
                                                                {new Date(
                                                                    order.created_at,
                                                                ).toLocaleTimeString(
                                                                    "es-MX",
                                                                    {
                                                                        hour: "2-digit",
                                                                        minute: "2-digit",
                                                                    },
                                                                )}
                                                            </p>
                                                        </div>
                                                        <span className="text-sm font-semibold text-emerald-700">
                                                            {money.format(
                                                                order.total_cents /
                                                                    100,
                                                            )}
                                                        </span>
                                                    </div>

                                                    <div className="mt-3 space-y-1 text-sm text-slate-600">
                                                        {(
                                                            orderItemsByOrder.get(
                                                                order.id,
                                                            ) ?? []
                                                        ).map((item) => (
                                                            <p
                                                                key={`${order.id}-${item.product_id}`}
                                                            >
                                                                {item.quantity}{" "}
                                                                x{" "}
                                                                {productMap.get(
                                                                    item.product_id,
                                                                ) ?? "Producto"}
                                                            </p>
                                                        ))}
                                                    </div>

                                                    {order.notes ? (
                                                        <p className="mt-3 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-600">
                                                            {order.notes}
                                                        </p>
                                                    ) : null}

                                                    {nextStatus ? (
                                                        <form
                                                            action={
                                                                updateOrderStatusAction
                                                            }
                                                            className="mt-4"
                                                        >
                                                            <input
                                                                type="hidden"
                                                                name="orderId"
                                                                value={order.id}
                                                            />
                                                            <input
                                                                type="hidden"
                                                                name="nextStatus"
                                                                value={
                                                                    nextStatus
                                                                }
                                                            />
                                                            <button
                                                                type="submit"
                                                                className="w-full rounded-2xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
                                                            >
                                                                {nextStatus ===
                                                                "in_progress"
                                                                    ? "Pasar a preparación"
                                                                    : nextStatus ===
                                                                        "ready"
                                                                      ? "Marcar como listo"
                                                                      : "Marcar como servido"}
                                                            </button>
                                                        </form>
                                                    ) : null}
                                                </article>
                                            );
                                        })
                                    )}
                                </div>
                            </section>
                        );
                    })}
                </div>
            </section>
        </main>
    );
}
