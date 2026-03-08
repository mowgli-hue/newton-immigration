export type MenuRow = {
  category_id: string;
  category_name: string;
  sort_order: number;
  item_id: string | null;
  item_name: string | null;
  description: string | null;
  price_cents: number | null;
  image_url: string | null;
  is_active: boolean | null;
};

export type TableRow = {
  id: string;
  table_code: string;
  display_name: string;
};

export type CreateOrderResponse = {
  data: {
    id: string;
    order_number: string;
    status: string;
    table_id: string;
    subtotal_cents: number;
    tax_cents: number;
    total_cents: number;
    payment_status: string;
  };
};

export type PayOrderResponse = {
  data: {
    id: string;
    order_number: string;
    status: string;
    payment_status: string;
    subtotal_cents: number;
    tax_cents: number;
    tip_cents: number;
    discount_cents: number;
    total_cents: number;
  };
};

export type OrderDetails = {
  id: string;
  order_number: string;
  status: "Placed" | "Accepted" | "Preparing" | "Ready for Pickup" | "Completed";
  payment_status: string;
  totals: {
    subtotal_cents: number;
    tax_cents: number;
    tip_cents: number;
    discount_cents: number;
    total_cents: number;
  };
  timing: {
    placed_at: string;
    completed_at: string | null;
  };
  table: {
    id: string;
    table_code: string;
    display_name: string;
  };
  items: Array<{
    id: string;
    menu_item_id: string;
    item_name_snapshot: string;
    unit_price_cents: number;
    qty: number;
    line_total_cents: number;
  }>;
  status_timeline: Array<{
    id: string;
    from_status: string | null;
    to_status: string;
    changed_by_role: string;
    changed_at: string;
  }>;
};

export type StaffCallResponse = {
  data: {
    id: string;
    table_id: string;
    status: "open" | "acknowledged" | "resolved";
    message: string | null;
    opened_at: string;
  };
};

function resolveApiBase(): string {
  if (typeof window === "undefined") {
    return process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4020";
  }

  const host = window.location.hostname;
  return `${window.location.protocol}//${host}:4020`;
}

export function resolveWsBase(): string {
  if (typeof window === "undefined") {
    return "ws://localhost:4020";
  }

  const host = window.location.hostname;
  return `${window.location.protocol === "https:" ? "wss" : "ws"}://${host}:4020`;
}

export async function fetchMenu(): Promise<MenuRow[]> {
  const response = await fetch(`${resolveApiBase()}/api/v1/menu`, { cache: "no-store" });
  if (!response.ok) {
    throw new Error(`Menu fetch failed: ${response.status}`);
  }

  const payload = (await response.json()) as { data: MenuRow[] };
  return payload.data;
}

export async function fetchTables(): Promise<TableRow[]> {
  const response = await fetch(`${resolveApiBase()}/api/v1/tables`, { cache: "no-store" });
  if (!response.ok) {
    throw new Error(`Tables fetch failed: ${response.status}`);
  }

  const payload = (await response.json()) as { data: TableRow[] };
  return payload.data;
}

export async function createOrder(input: {
  table_id: string;
  items: Array<{ menu_item_id: string; qty: number }>;
}): Promise<CreateOrderResponse["data"]> {
  const response = await fetch(`${resolveApiBase()}/api/v1/orders`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input)
  });

  const payload = (await response.json()) as CreateOrderResponse | { error: string };
  if (!response.ok) {
    throw new Error("error" in payload ? payload.error : `Order create failed: ${response.status}`);
  }

  return (payload as CreateOrderResponse).data;
}

export async function payOrder(input: {
  order_id: string;
  amount_cents: number;
  tip_cents?: number;
  provider: "tap" | "qr";
}): Promise<PayOrderResponse["data"]> {
  const response = await fetch(`${resolveApiBase()}/api/v1/orders/${input.order_id}/pay`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      amount_cents: input.amount_cents,
      tip_cents: input.tip_cents ?? 0,
      provider: input.provider,
      provider_ref: `${input.provider}_${Date.now()}`
    })
  });

  const payload = (await response.json()) as PayOrderResponse | { error: string };
  if (!response.ok) {
    throw new Error("error" in payload ? payload.error : `Payment failed: ${response.status}`);
  }

  return (payload as PayOrderResponse).data;
}

export async function fetchOrderById(orderId: string): Promise<OrderDetails> {
  const response = await fetch(`${resolveApiBase()}/api/v1/orders/${orderId}`, { cache: "no-store" });
  const payload = (await response.json()) as { data: OrderDetails } | { error: string };

  if (!response.ok) {
    throw new Error("error" in payload ? payload.error : `Order fetch failed: ${response.status}`);
  }

  return (payload as { data: OrderDetails }).data;
}

export async function createStaffCall(input: { table_id: string; message?: string }): Promise<StaffCallResponse["data"]> {
  const response = await fetch(`${resolveApiBase()}/api/v1/staff-calls`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input)
  });

  const payload = (await response.json()) as StaffCallResponse | { error: string };
  if (!response.ok) {
    throw new Error("error" in payload ? payload.error : `Staff call failed: ${response.status}`);
  }

  return (payload as StaffCallResponse).data;
}
