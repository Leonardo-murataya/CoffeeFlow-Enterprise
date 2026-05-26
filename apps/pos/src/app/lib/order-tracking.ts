import {
    createSupabaseServiceClient,
    ensureDemoData,
} from "@coffeeflow/database";

export type OrderTrackingItem = {
    productId: string;
    name: string;
    quantity: number;
    lineTotalText: string;
};

export type OrderTrackingTicket = {
    id: string;
    status: "pending" | "in_progress" | "ready" | "served";
    createdAt: string;
    statusLabel: string;
    totalText: string;
    notes: string | null;
    items: OrderTrackingItem[];
};

export type OrderTrackingSnapshot = {
    generatedAt: string;
    query: string;
    tickets: OrderTrackingTicket[];
    matchedTicket: OrderTrackingTicket | null;
    readyTickets?: OrderTrackingTicket[];
};

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

const statusLabelMap: Record<OrderTrackingTicket["status"], string> = {
    pending: "Pendiente",
    in_progress: "En preparación",
    ready: "Listo",
    served: "Entregado",
};

function normalizeTicketStatus(
    status: OrderRow["status"],
): OrderTrackingTicket["status"] {
    if (status === "cancelled") {
        return "pending";
    }

    return status;
}

export async function loadOrderTrackingSnapshot(query = "") {
    const client = createSupabaseServiceClient();

    await ensureDemoData(client);

    const normalizedQuery = query.trim().toLowerCase();

    const [
        { data: ordersData, error: ordersError },
        { data: orderItemsData, error: orderItemsError },
        { data: productsData, error: productsError },
    ] = await Promise.all([
        client
            .from("orders")
            .select("id, status, total_cents, created_at, notes")
            .order("created_at", { ascending: false })
            .limit(30),
        client
            .from("order_items")
            .select("order_id, quantity, line_total_cents, product_id"),
        client.from("products").select("id, name"),
    ]);

    if (ordersError) {
        throw ordersError;
    }

    if (orderItemsError) {
        throw orderItemsError;
    }

    if (productsError) {
        throw productsError;
    }

    const orders = (ordersData ?? []) as OrderRow[];
    const orderItems = (orderItemsData ?? []) as OrderItemRow[];
    const products = (productsData ?? []) as ProductRow[];

    const orderItemsByOrder = new Map<string, OrderItemRow[]>();

    for (const item of orderItems) {
        const list = orderItemsByOrder.get(item.order_id) ?? [];
        list.push(item);
        orderItemsByOrder.set(item.order_id, list);
    }

    const productNameMap = new Map(
        products.map((product) => [product.id, product.name]),
    );

    const tickets = orders
        .filter((order) => order.status !== "cancelled")
        .map((order) => ({
            id: order.id,
            status: normalizeTicketStatus(order.status),
            createdAt: order.created_at,
            statusLabel:
                statusLabelMap[normalizeTicketStatus(order.status)],
            totalText: money.format(order.total_cents / 100),
            notes: order.notes,
            items: (orderItemsByOrder.get(order.id) ?? []).map((item) => ({
                productId: item.product_id,
                name: productNameMap.get(item.product_id) ?? "Producto",
                quantity: item.quantity,
                lineTotalText: money.format(item.line_total_cents / 100),
            })),
        }));

    const activeTickets = tickets.filter(
        (ticket) => ticket.status === "in_progress",
    );
    const readyTickets = tickets
        .filter((ticket) => ticket.status === "ready")
        .slice(0, 10);
    const matchedTicket = normalizedQuery
        ? (tickets.find((ticket) =>
              ticket.id.toLowerCase().includes(normalizedQuery),
          ) ?? null)
        : null;

    return {
        generatedAt: new Date().toISOString(),
        query,
        tickets: activeTickets,
        matchedTicket,
        readyTickets,
    } satisfies OrderTrackingSnapshot;
}
