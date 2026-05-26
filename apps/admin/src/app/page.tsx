import Link from "next/link";
import { ThemeToggle } from "@coffeeflow/ui";
import OrdersRealtime from "./OrdersRealtime";
import { AdminShell, Panel, StatCard, ToneChip } from "./components/admin-ui";
import {
    buildOrderStatusSummary,
    buildRecentOrders,
    buildTopProductsToday,
    formatMoneyMXN,
    isSameLocalDay,
    loadAdminSnapshot,
} from "./lib/admin-data";
import { restockCriticalAction } from "./actions";

export const dynamic = "force-dynamic";

function translateOrderStatus(status: string) {
    switch (status) {
        case "pending":
            return "Pendiente";
        case "in_progress":
            return "En preparación";
        case "ready":
            return "Listo";
        case "served":
            return "Entregado";
        case "cancelled":
            return "Cancelado";
        default:
            return status;
    }
}

function statusTone(status: string) {
    switch (status) {
        case "pending":
            return "amber";
        case "in_progress":
            return "sky";
        case "ready":
        case "served":
            return "emerald";
        case "cancelled":
            return "rose";
        default:
            return "slate";
    }
}

export default async function Home() {
    const snapshot = await loadAdminSnapshot();
    const todayOrders = snapshot.orders.filter((order) =>
        isSameLocalDay(order.created_at),
    );
    const statusSummary = buildOrderStatusSummary(snapshot);
    const recentOrders = buildRecentOrders(snapshot, 6);
    const topProducts = buildTopProductsToday(snapshot, 5);
    const lowStockItems = snapshot.inventory
        .filter((item) => item.current_quantity < item.minimum_quantity)
        .sort(
            (left, right) =>
                left.current_quantity -
                left.minimum_quantity -
                (right.current_quantity - right.minimum_quantity),
        );

    const todayRevenue = todayOrders.reduce(
        (sum, order) => sum + order.total_cents,
        0,
    );
    const openToday = todayOrders.filter(
        (order) => order.status === "pending" || order.status === "in_progress",
    ).length;
    const readyToday = todayOrders.filter(
        (order) => order.status === "ready",
    ).length;
    const servedToday = todayOrders.filter(
        (order) => order.status === "served",
    ).length;
    const criticalInventory = lowStockItems.length;
    const activeProducts = snapshot.products.filter(
        (product) => product.is_active,
    ).length;
    const averageTicket =
        todayOrders.length === 0
            ? 0
            : Math.round(todayRevenue / todayOrders.length);

    const lastOrder = snapshot.orders[0];

    return (
        <AdminShell
            activeHref="/"
            eyebrow="Centro de operaciones"
            title="Resumen del negocio"
            description="Ventas del día, alertas críticas y atajos reales para operar la cafetería sin ruido."
            headerActions={<ThemeToggle />}
            summary={
                <div className="space-y-2">
                    <p className="text-sm font-semibold text-slate-900">
                        En vivo y sincronizado
                    </p>
                    <p className="text-sm text-slate-600">
                        {todayOrders.length} pedidos hoy · {criticalInventory}{" "}
                        alertas de inventario
                    </p>
                    <p className="text-xs text-slate-500">
                        Último pedido:{" "}
                        {lastOrder ? lastOrder.id.slice(0, 8) : "sin datos"}
                    </p>
                </div>
            }
        >
            <Panel title="Pedidos recientes">
                <div className="mt-5 grid gap-3 md:grid-cols-2">
                    {recentOrders.map((order) => (
                        <article
                            key={order.id}
                            className="rounded-3xl border border-slate-200 bg-slate-50 p-4"
                        >
                            <div className="flex items-start justify-between gap-3">
                                <div>
                                    <p className="text-sm font-semibold text-slate-950">
                                        Ticket {order.id.slice(0, 8)}
                                    </p>
                                    <p className="text-xs uppercase tracking-[0.24em] text-slate-500">
                                        {new Date(
                                            order.created_at,
                                        ).toLocaleString("es-MX", {
                                            dateStyle: "short",
                                            timeStyle: "short",
                                        })}
                                    </p>
                                </div>
                                <ToneChip tone={statusTone(order.status)}>
                                    {translateOrderStatus(order.status)}
                                </ToneChip>
                            </div>

                            <p className="mt-3 text-sm text-slate-700">
                                {order.summary ||
                                    `${order.itemCount} artículos`}
                            </p>
                            <div className="mt-3 flex items-center justify-between text-sm">
                                <span className="text-slate-500">
                                    {order.notes
                                        ? `Nota: ${order.notes}`
                                        : "Sin notas"}
                                </span>
                                <span className="font-semibold text-slate-950">
                                    {formatMoneyMXN(order.total_cents)}
                                </span>
                            </div>
                        </article>
                    ))}
                </div>
            </Panel>

            <Panel
                title="Top 5 más pedidos hoy"
                subtitle="Los platillos que más se movieron en el turno actual."
            >
                <div className="space-y-3">
                    {topProducts.length === 0 ? (
                        <p className="rounded-3xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
                            Aún no hay ventas hoy.
                        </p>
                    ) : (
                        topProducts.map((product, index) => (
                            <article
                                key={product.id}
                                className="rounded-3xl border border-slate-200 bg-slate-50 p-4"
                            >
                                <div className="flex items-start justify-between gap-3">
                                    <div>
                                        <p className="text-xs uppercase tracking-[0.24em] text-slate-500">
                                            #{index + 1} · {product.category}
                                        </p>
                                        <p className="mt-1 text-sm font-semibold text-slate-950">
                                            {product.name}
                                        </p>
                                    </div>
                                    <div className="text-right text-sm">
                                        <p className="font-semibold text-slate-950">
                                            {product.quantity} uds
                                        </p>
                                        <p className="text-slate-500">
                                            {product.orders} pedidos ·{" "}
                                            {product.revenueText}
                                        </p>
                                    </div>
                                </div>
                            </article>
                        ))
                    )}
                </div>
            </Panel>

            <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
                <Panel
                    title="Atajos operativos"
                    subtitle="Acceso directo a las vistas que sí se usan en piso."
                >
                    <div className="grid gap-3 md:grid-cols-2">
                        <Link
                            href="/estado-platillos"
                            className="rounded-3xl border border-slate-200 bg-slate-50 p-4 hover:-translate-y-0.5 hover:bg-slate-100"
                        >
                            <p className="text-sm font-semibold text-slate-950">
                                Menú e inventario
                            </p>
                            <p className="mt-1 text-sm text-slate-600">
                                Precios, categorías, stock y recetas.
                            </p>
                        </Link>
                        <Link
                            href="http://localhost:3002/seguimiento-pedido"
                            className="rounded-3xl border border-slate-200 bg-slate-50 p-4 hover:-translate-y-0.5 hover:bg-slate-100"
                        >
                            <p className="text-sm font-semibold text-slate-950">
                                Seguimiento público
                            </p>
                            <p className="mt-1 text-sm text-slate-600">
                                Revisión rápida de pedidos visibles para
                                clientes.
                            </p>
                        </Link>
                        <Link
                            href="http://localhost:3002/marcar-entregado"
                            className="rounded-3xl border border-slate-200 bg-slate-50 p-4 hover:-translate-y-0.5 hover:bg-slate-100"
                        >
                            <p className="text-sm font-semibold text-slate-950">
                                Marcar entregado
                            </p>
                            <p className="mt-1 text-sm text-slate-600">
                                Cerrar tickets listos sin pasos extra.
                            </p>
                        </Link>
                        <Link
                            href="http://localhost:3001/"
                            className="rounded-3xl border border-slate-200 bg-slate-50 p-4 hover:-translate-y-0.5 hover:bg-slate-100"
                        >
                            <p className="text-sm font-semibold text-slate-950">
                                KDS
                            </p>
                            <p className="mt-1 text-sm text-slate-600">
                                Cola de cocina en tiempo real.
                            </p>
                        </Link>
                    </div>
                </Panel>
            </div>
        </AdminShell>
    );
}
