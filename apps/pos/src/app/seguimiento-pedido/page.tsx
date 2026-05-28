import Link from "next/link";
import { StatusPill, ThemeToggle } from "@coffeeflow/ui";
import { loadOrderTrackingSnapshot } from "../lib/order-tracking";
import OrdersRealtime from "../OrdersRealtime";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function formatTime(value: string) {
    return new Date(value).toLocaleTimeString("es-MX", {
        hour: "2-digit",
        minute: "2-digit",
    });
}

function StatCard({
    title,
    value,
    detail,
}: {
    title: string;
    value: string;
    detail: string;
}) {
    return (
        <article className="rounded-4xl border border-slate-200 bg-white p-5 shadow-sm hover:-translate-y-0.5">
            <p className="text-sm font-medium text-slate-500">{title}</p>
            <p className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">
                {value}
            </p>
            <p className="mt-3 text-sm leading-6 text-slate-600">{detail}</p>
        </article>
    );
}

export default async function SeguimientoPedidoPage({
    searchParams,
}: {
    searchParams?: Promise<{ ticket?: string }>;
}) {
    const params = await searchParams;
    const query = params?.ticket ?? "";
    const snapshot = await loadOrderTrackingSnapshot(query);

    const totalTickets = snapshot.tickets.length;

    const readyItemsMap = new Map<string, number>();
    (snapshot.readyTickets ?? []).forEach((t) =>
        t.items.forEach((i) =>
            readyItemsMap.set(
                i.name,
                (readyItemsMap.get(i.name) ?? 0) + i.quantity,
            ),
        ),
    );

    const readyEntries = Array.from(readyItemsMap.entries())
        .map(([name, qty]) => ({ name, qty }))
        .sort((a, b) => b.qty - a.qty);
    const totalReadyQty = readyEntries.reduce((s, it) => s + it.qty, 0);

    const resultContent = (() => {
        if (snapshot.query) {
            if (snapshot.matchedTicket) {
                return (
                    <article className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                            <div>
                                <p className="text-sm font-medium uppercase tracking-[0.24em] text-slate-500">
                                    Ticket{" "}
                                    {snapshot.matchedTicket.id.slice(0, 8)}
                                </p>
                                <h3 className="mt-1 text-2xl font-semibold text-slate-950">
                                    {snapshot.matchedTicket.statusLabel}
                                </h3>
                                <p className="mt-1 text-sm text-slate-600">
                                    Recibido a las{" "}
                                    {formatTime(
                                        snapshot.matchedTicket.createdAt,
                                    )}
                                </p>
                            </div>

                            <div className="text-right">
                                <StatusPill
                                    tone={
                                        snapshot.matchedTicket.statusLabel
                                            .toLowerCase()
                                            .includes("list")
                                            ? "emerald"
                                            : "amber"
                                    }
                                    label={snapshot.matchedTicket.statusLabel}
                                />
                                <p className="mt-2 text-sm font-semibold text-slate-950">
                                    {snapshot.matchedTicket.totalText}
                                </p>
                            </div>
                        </div>

                        <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                            {snapshot.matchedTicket.items.map((item) => (
                                <div
                                    key={`${snapshot.matchedTicket?.id}-${item.productId}`}
                                    className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
                                >
                                    <p className="font-medium text-slate-950">
                                        {item.name}
                                    </p>
                                    <p className="mt-1 text-sm text-slate-600">
                                        {item.quantity} x {item.lineTotalText}
                                    </p>
                                </div>
                            ))}
                        </div>

                        {snapshot.matchedTicket.notes ? (
                            <p className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
                                {snapshot.matchedTicket.notes}
                            </p>
                        ) : null}
                    </article>
                );
            }

            return (
                <p className="rounded-3xl border border-slate-200 bg-slate-50 p-5 text-sm text-slate-600">
                    No encontramos un ticket activo con ese número.
                </p>
            );
        }

        if (
            snapshot.tickets.length === 0 &&
            (snapshot.readyTickets ?? []).length === 0
        ) {
            return (
                <p className="rounded-3xl border border-slate-200 bg-slate-50 p-5 text-sm text-slate-600">
                    No hay tickets en preparación ahora mismo.
                </p>
            );
        }

        return (
            <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-4">
                    <h3 className="text-lg font-semibold">En preparación</h3>
                    {snapshot.tickets.length === 0 ? (
                        <p className="rounded-3xl border border-slate-200 bg-slate-50 p-5 text-sm text-slate-600">
                            No hay pedidos en preparación.
                        </p>
                    ) : (
                        <div className="mt-2 max-h-[60vh] overflow-y-auto space-y-4 pr-2">
                            {snapshot.tickets.map((ticket) => (
                                <article
                                    key={ticket.id}
                                    className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm"
                                >
                                    <div className="flex flex-wrap items-center justify-between gap-3">
                                        <div>
                                            <p className="text-sm font-medium uppercase tracking-[0.24em] text-slate-500">
                                                Ticket {ticket.id.slice(0, 8)}
                                            </p>
                                            <h3 className="mt-1 text-2xl font-semibold text-slate-950">
                                                {ticket.statusLabel}
                                            </h3>
                                        </div>
                                        <div className="text-right">
                                            <StatusPill
                                                tone="amber"
                                                label="En preparación"
                                            />
                                            <p className="mt-2 text-sm font-semibold text-slate-950">
                                                {ticket.totalText}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="mt-4 grid gap-2 md:grid-cols-2 xl:grid-cols-3">
                                        {ticket.items.map((item) => (
                                            <div
                                                key={`${ticket.id}-${item.productId}`}
                                                className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3"
                                            >
                                                <p className="font-medium text-slate-950">
                                                    {item.name}
                                                </p>
                                                <p className="text-sm text-slate-600">
                                                    {item.quantity} x{" "}
                                                    {item.lineTotalText}
                                                </p>
                                            </div>
                                        ))}
                                    </div>
                                </article>
                            ))}
                        </div>
                    )}
                </div>

                <div className="space-y-4">
                    <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                        <h3 className="text-lg font-semibold">
                            Tickets listos
                        </h3>
                        {(snapshot.readyTickets ?? []).length === 0 ? (
                            <p className="mt-3 text-sm text-slate-600">
                                No hay tickets listos recientemente.
                            </p>
                        ) : (
                            <div className="mt-3 max-h-[60vh] overflow-y-auto space-y-3 pr-2">
                                {(snapshot.readyTickets ?? []).map((ticket) => (
                                    <article
                                        key={ticket.id}
                                        className="rounded-3xl border border-slate-200 bg-slate-50 p-4"
                                    >
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className="text-sm font-medium uppercase tracking-[0.24em] text-slate-500">
                                                    Ticket{" "}
                                                    {ticket.id.slice(0, 8)}
                                                </p>
                                                <p className="mt-1 text-sm text-slate-600">
                                                    Recibido a las{" "}
                                                    {formatTime(
                                                        ticket.createdAt,
                                                    )}
                                                </p>
                                            </div>
                                            <div className="text-right">
                                                <StatusPill
                                                    tone="emerald"
                                                    label="Listo"
                                                />
                                                <p className="mt-2 text-sm font-semibold text-slate-950">
                                                    {ticket.totalText}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="mt-3 grid gap-2 md:grid-cols-1">
                                            {ticket.items.map((item) => (
                                                <div
                                                    key={`${ticket.id}-${item.productId}`}
                                                    className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-4 py-3"
                                                >
                                                    <p className="font-medium text-slate-950">
                                                        {item.name}
                                                    </p>
                                                    <p className="text-sm text-slate-600">
                                                        {item.quantity} x
                                                    </p>
                                                </div>
                                            ))}
                                        </div>
                                    </article>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        );
    })();

    return (
        <main className="min-h-dvh bg-linear-to-br from-white via-slate-50 to-slate-100 px-4 py-6 text-slate-950 md:px-8 md:py-8">
            <section className="mx-auto flex max-w-6xl flex-col gap-6">
                <OrdersRealtime />
                <header className="rounded-4xl border border-slate-200/80 bg-white p-5 shadow-[0_18px_60px_rgba(15,23,42,0.08)] md:p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <div className="inline-flex rounded-full bg-slate-950 px-3 py-1 text-xs font-semibold uppercase tracking-[0.32em] text-white">
                                CoffeeFlow Pedido
                            </div>
                            <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950 md:text-4xl">
                                Seguimiento público
                            </h1>
                        </div>
                        <div className="flex items-center gap-3">
                            <Link
                                href="/"
                                className="inline-flex items-center gap-2 rounded-md bg-slate-50 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
                            >
                                ← Volver al POS
                            </Link>
                            <ThemeToggle />
                        </div>
                    </div>
                </header>

                <div className="grid gap-4 md:grid-cols-3">
                    <StatCard
                        title="Tickets en preparación"
                        value={String(totalTickets)}
                        detail="Solo pedidos activos visibles para el cliente"
                    />
                    <StatCard
                        title="Platillos listos"
                        value={String(totalReadyQty)}
                        detail="Total de productos listos recientemente"
                    />
                    <StatCard
                        title="Última sincronización"
                        value={formatTime(snapshot.generatedAt)}
                        detail="Datos leídos directo de Supabase"
                    />
                </div>

                <section className="rounded-4xl border border-slate-200 bg-white p-5 shadow-sm md:p-6">
                    <div className="mb-4">
                        <h2 className="text-xl font-semibold">Resultado</h2>
                        <p className="text-sm leading-6 text-slate-600">
                            {snapshot.query
                                ? `Búsqueda para ticket ${snapshot.query}`
                                : ""}
                        </p>
                    </div>

                    {resultContent}
                </section>
            </section>
        </main>
    );
}
