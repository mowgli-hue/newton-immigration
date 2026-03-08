export type KdsOrder = {
  id: string;
  order_number: string;
  status: "Placed" | "Accepted" | "Preparing" | "Ready for Pickup" | "Completed";
  placed_at: string;
  subtotal_cents: number;
  tax_cents: number;
  total_cents: number;
  table_code: string;
  display_name: string;
  items: Array<{
    order_item_id: string;
    menu_item_id: string;
    name: string;
    unit_price_cents: number;
    qty: number;
    line_total_cents: number;
  }>;
};

export type StaffCall = {
  id: string;
  table_id: string;
  status: "open" | "acknowledged" | "resolved";
  message: string | null;
  opened_at: string;
  resolved_at: string | null;
  table_code: string;
  display_name: string;
};

function apiBase(): string {
  if (typeof window === "undefined") {
    return process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4020";
  }
  const host = window.location.hostname;
  return `${window.location.protocol}//${host}:4020`;
}

function wsBase(): string {
  if (typeof window === "undefined") {
    return "ws://localhost:4020";
  }
  const host = window.location.hostname;
  return `${window.location.protocol === "https:" ? "wss" : "ws"}://${host}:4020`;
}

export function getWsBase() {
  return wsBase();
}

export async function fetchKdsOrders(includeCompleted: boolean): Promise<KdsOrder[]> {
  const response = await fetch(
    `${apiBase()}/api/v1/kds/orders?include_completed=${includeCompleted ? "true" : "false"}`,
    { cache: "no-store" }
  );

  const payload = (await response.json()) as { data: KdsOrder[] } | { error: string };
  if (!response.ok) {
    throw new Error("error" in payload ? payload.error : `KDS fetch failed: ${response.status}`);
  }

  return (payload as { data: KdsOrder[] }).data;
}

export async function updateOrderStatus(orderId: string, status: KdsOrder["status"]) {
  const response = await fetch(`${apiBase()}/api/v1/orders/${orderId}/status`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status, changed_by_role: "kitchen" })
  });

  const payload = (await response.json()) as { data: unknown } | { error: string };
  if (!response.ok) {
    throw new Error("error" in payload ? payload.error : `Status update failed: ${response.status}`);
  }
}

export async function fetchStaffCalls(includeResolved: boolean): Promise<StaffCall[]> {
  const response = await fetch(
    `${apiBase()}/api/v1/staff-calls?include_resolved=${includeResolved ? "true" : "false"}`,
    { cache: "no-store" }
  );

  const payload = (await response.json()) as { data: StaffCall[] } | { error: string };
  if (!response.ok) {
    throw new Error("error" in payload ? payload.error : `Staff calls fetch failed: ${response.status}`);
  }

  return (payload as { data: StaffCall[] }).data;
}

export async function resolveStaffCall(callId: string) {
  const response = await fetch(`${apiBase()}/api/v1/staff-calls/${callId}/resolve`, {
    method: "POST"
  });

  const payload = (await response.json()) as { data: unknown } | { error: string };
  if (!response.ok) {
    throw new Error("error" in payload ? payload.error : `Resolve call failed: ${response.status}`);
  }
}
