import {
    createSupabaseServiceClient,
    ensureDemoData,
} from "@coffeeflow/database";
import { ThemeToggle } from "@coffeeflow/ui";
import Link from "next/link";
import { PosWorkbench } from "./pos-workbench";
import OrdersRealtime from "./OrdersRealtime";

export const dynamic = "force-dynamic";

type ProductRow = {
    id: string;
    name: string;
    description: string | null;
    price_cents: number;
    category_id: string | null;
    is_active: boolean;
};

type CategoryRow = {
    id: string;
    name: string;
};

type RecentOrderRow = {
    id: string;
    status: "pending" | "in_progress" | "ready" | "served" | "cancelled";
    total_cents: number;
    created_at: string;
    notes: string | null;
};

const money = new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
});

export default async function Home() {
    const client = createSupabaseServiceClient();

    await ensureDemoData(client);

    const [
        { data: productsData },
        { data: categoriesData },
        { data: ordersData },
    ] = await Promise.all([
        client
            .from("products")
            .select(
                "id, name, description, price_cents, category_id, is_active",
            )
            .eq("is_active", true)
            .order("name", { ascending: true }),
        client.from("product_categories").select("id, name").order("name", {
            ascending: true,
        }),
        client
            .from("orders")
            .select("id, status, total_cents, created_at, notes")
            .order("created_at", { ascending: false })
            .limit(18),
    ]);

    const categoryMap = new Map(
        ((categoriesData ?? []) as CategoryRow[]).map((category) => [
            category.id,
            category.name,
        ]),
    );

    const products = ((productsData ?? []) as ProductRow[]).map((product) => ({
        id: product.id,
        name: product.name,
        description: product.description,
        price_cents: product.price_cents,
        categoryName:
            categoryMap.get(product.category_id ?? "") ?? "Sin categoría",
    }));

    const categoryNames = Array.from(
        new Set(products.map((product) => product.categoryName)),
    ).sort((a, b) => a.localeCompare(b, "es-MX"));

    const recentOrders = (ordersData ?? []) as RecentOrderRow[];
    const pendingOrders = recentOrders.filter(
        (order) => order.status === "pending",
    ).length;
    const inProgressOrders = recentOrders.filter(
        (order) => order.status === "in_progress",
    ).length;
    const todayRevenue = recentOrders.reduce(
        (accumulator, order) => accumulator + order.total_cents,
        0,
    );
    const averageTicket =
        recentOrders.length > 0 ? todayRevenue / recentOrders.length : 0;
    const readyOrders = recentOrders.filter(
        (order) => order.status === "ready",
    ).length;
    const activeOrders = recentOrders.filter(
        (order) => order.status === "in_progress",
    ).length;

    // Top 5 productos del día (por cantidad)
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const { data: todayItemsData } = await client
        .from("order_items")
        .select("product_id, quantity, products(name)")
        .gte("created_at", startOfDay.toISOString());

    const counts = new Map<string, { name: string; qty: number }>();
    (todayItemsData ?? []).forEach((row: any) => {
        const pid: string = row.product_id;
        const name: string =
            row.products?.name ??
            products.find((p) => p.id === pid)?.name ??
            "Desconocido";
        const prev = counts.get(pid);
        counts.set(pid, { name, qty: (prev?.qty ?? 0) + (row.quantity ?? 0) });
    });

    const top5 = Array.from(counts.values())
        .sort((a, b) => b.qty - a.qty)
        .slice(0, 5);

    return (
        <main className="min-h-dvh bg-linear-to-br from-white via-slate-50 to-slate-100 px-4 py-6 text-slate-950 md:px-8 md:py-8">
            <section className="mx-auto flex max-w-7xl flex-col gap-6">
                <OrdersRealtime />
                <header className="rounded-4xl border border-slate-200/80 bg-white/90 p-5 shadow-[0_18px_60px_rgba(15,23,42,0.08)] backdrop-blur md:p-6">
                    <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
                        <div className="space-y-3">
                            <div className="inline-flex rounded-full bg-slate-950 px-3 py-1 text-xs font-semibold uppercase tracking-[0.32em] text-white">
                                CoffeeFlow Caja
                            </div>
                            <div className="space-y-2">
                                <p className="text-sm font-medium uppercase tracking-[0.28em] text-sky-700">
                                    Punto de venta
                                </p>
                                <h1 className="max-w-3xl text-3xl font-semibold tracking-tight text-slate-950 md:text-5xl">
                                    CoffeeFlow POS
                                </h1>
                                <p className="max-w-3xl text-sm leading-6 text-slate-600 md:text-base">
                                    Toma pedidos, envía comandas al KDS y mantén
                                    el flujo de la cafetería sincronizado en
                                    tiempo real.
                                </p>
                            </div>
                        </div>

                        <div className="grid gap-3 rounded-3xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700 shadow-sm md:min-w-80 md:grid-cols-2">
                            <div className="md:col-span-2 flex justify-end">
                                <ThemeToggle />
                            </div>
                            <div>
                                <p className="text-xs uppercase tracking-[0.24em] text-slate-500">
                                    Productos
                                </p>
                                <p className="mt-1 text-2xl font-semibold text-slate-950">
                                    {products.length}
                                </p>
                            </div>
                            <div>
                                <p className="text-xs uppercase tracking-[0.24em] text-slate-500">
                                    Conectado
                                </p>
                                <p className="mt-1 text-2xl font-semibold text-slate-950">
                                    Supabase
                                </p>
                            </div>
                            <Link
                                href="/seguimiento-pedido"
                                className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-center text-xs font-semibold text-slate-950 shadow-sm transition hover:-translate-y-0.5 hover:bg-slate-50"
                            >
                                Seguimiento público
                            </Link>
                            <Link
                                href="/marcar-entregado"
                                className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-center text-xs font-semibold text-slate-950 shadow-sm transition hover:-translate-y-0.5 hover:bg-slate-50"
                            >
                                Entregar pedidos
                            </Link>
                        </div>
                    </div>
                </header>

                <div className="grid gap-4 md:grid-cols-4">
                    {[
                        {
                            title: "Pedidos pendientes",
                            value: String(pendingOrders),
                            detail: "Tickets listos para cobrar",
                            accent: "amber",
                        },
                        {
                            title: "En preparación",
                            value: String(activeOrders),
                            detail: "Flujo actual hacia cocina",
                            accent: "sky",
                        },
                        {
                            title: "Listos",
                            value: String(readyOrders),
                            detail: "Pedidos que ya pueden salir",
                            accent: "emerald",
                        },
                        {
                            title: "Ticket promedio",
                            value: money.format(averageTicket / 100),
                            detail: `Ventas recientes: ${money.format(todayRevenue / 100)}`,
                            accent: "slate",
                        },
                    ].map((metric) => (
                        <article
                            key={metric.title}
                            className="rounded-4xl border border-slate-200 bg-white p-5 shadow-sm hover:-translate-y-0.5"
                        >
                            <div className="flex items-start justify-between gap-3">
                                <div>
                                    <p className="text-sm font-medium text-slate-500">
                                        {metric.title}
                                    </p>
                                    <p className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">
                                        {metric.value}
                                    </p>
                                </div>
                                <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">
                                    En vivo
                                </span>
                            </div>
                            <p className="mt-3 text-sm leading-6 text-slate-600">
                                {metric.detail}
                            </p>
                        </article>
                    ))}
                </div>

                <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                    <h2 className="text-sm font-medium text-slate-500">
                        Top 5 del día
                    </h2>
                    {top5.length === 0 ? (
                        <p className="mt-2 text-sm text-slate-600">
                            No hay pedidos hoy.
                        </p>
                    ) : (
                        <ol className="mt-3 space-y-2 list-decimal list-inside">
                            {top5.map((p, idx) => (
                                <li
                                    key={p.name}
                                    className="flex items-center justify-between rounded-2xl border border-slate-100 bg-slate-50 px-3 py-2"
                                >
                                    <span className="font-medium text-slate-900">
                                        {p.name}
                                    </span>
                                    <span className="text-sm text-slate-600">
                                        {p.qty} uds
                                    </span>
                                </li>
                            ))}
                        </ol>
                    )}
                </section>

                <PosWorkbench
                    products={products}
                    recentOrders={recentOrders}
                    categories={categoryNames}
                />
            </section>
        </main>
    );
}
