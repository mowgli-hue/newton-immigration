"use client";

import { useEffect, useMemo, useState } from "react";
import {
  createStaffCall,
  createOrder,
  fetchMenu,
  fetchOrderById,
  fetchTables,
  payOrder,
  resolveWsBase,
  type MenuRow,
  type OrderDetails,
  type TableRow
} from "../lib/api";

type CartState = Record<string, { qty: number; name: string; unitPriceCents: number }>;
type PaymentMethod = "tap" | "qr" | "cash";

type OrderStatus = "Placed" | "Accepted" | "Preparing" | "Ready for Pickup" | "Completed";
const STATUS_FLOW: OrderStatus[] = ["Placed", "Accepted", "Preparing", "Ready for Pickup", "Completed"];

function centsToCurrency(cents: number) {
  return new Intl.NumberFormat("en-CA", {
    style: "currency",
    currency: "CAD"
  }).format(cents / 100);
}

export default function TabletHomePage() {
  const [menuRows, setMenuRows] = useState<MenuRow[]>([]);
  const [tables, setTables] = useState<TableRow[]>([]);
  const [tableId, setTableId] = useState("");
  const [cart, setCart] = useState<CartState>({});
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [cartOpen, setCartOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("tap");
  const [activeOrderId, setActiveOrderId] = useState("");
  const [activeOrder, setActiveOrder] = useState<OrderDetails | null>(null);
  const [statusLoading, setStatusLoading] = useState(false);
  const [isCallingWaiter, setIsCallingWaiter] = useState(false);

  useEffect(() => {
    async function bootstrap() {
      try {
        const [menu, activeTables] = await Promise.all([fetchMenu(), fetchTables()]);
        setMenuRows(menu.filter((item) => item.item_id && item.is_active));
        setTables(activeTables);
        if (activeTables[0]?.id) {
          setTableId(activeTables[0].id);
        }
      } catch (fetchError) {
        setError(fetchError instanceof Error ? fetchError.message : "Failed to load app data.");
      } finally {
        setLoading(false);
      }
    }

    bootstrap();
  }, []);

  useEffect(() => {
    if (!activeOrderId) return;

    let isCancelled = false;

    async function loadOrder() {
      try {
        setStatusLoading(true);
        const details = await fetchOrderById(activeOrderId);
        if (!isCancelled) {
          setActiveOrder(details);
        }
      } catch (fetchError) {
        if (!isCancelled) {
          setError(fetchError instanceof Error ? fetchError.message : "Failed to load order status.");
        }
      } finally {
        if (!isCancelled) {
          setStatusLoading(false);
        }
      }
    }

    loadOrder();

    return () => {
      isCancelled = true;
    };
  }, [activeOrderId]);

  useEffect(() => {
    if (!activeOrderId) return;

    const socket = new WebSocket(`${resolveWsBase()}/ws`);

    socket.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data) as {
          event?: string;
          payload?: { order_id?: string };
        };

        if (message.event === "order.status_changed" && message.payload?.order_id === activeOrderId) {
          fetchOrderById(activeOrderId)
            .then((details) => setActiveOrder(details))
            .catch(() => undefined);
        }
      } catch {
        return;
      }
    };

    return () => {
      socket.close();
    };
  }, [activeOrderId]);

  const groupedMenu = useMemo(() => {
    const map = new Map<string, { categoryName: string; items: MenuRow[] }>();
    for (const row of menuRows) {
      if (!row.category_id || !row.category_name) continue;
      if (!map.has(row.category_id)) {
        map.set(row.category_id, { categoryName: row.category_name, items: [] });
      }
      map.get(row.category_id)?.items.push(row);
    }
    return Array.from(map.values());
  }, [menuRows]);

  const subtotalCents = useMemo(
    () => Object.values(cart).reduce((sum, item) => sum + item.qty * item.unitPriceCents, 0),
    [cart]
  );
  const taxCents = Math.round(subtotalCents * 0.13);
  const totalCents = subtotalCents + taxCents;

  function addItem(row: MenuRow) {
    if (!row.item_id || !row.item_name || row.price_cents === null) return;
    const itemId = row.item_id;
    const itemName = row.item_name;
    const unitPriceCents = row.price_cents;

    setCart((previous) => {
      const existing = previous[itemId];
      return {
        ...previous,
        [itemId]: {
          qty: existing ? existing.qty + 1 : 1,
          name: itemName,
          unitPriceCents
        }
      };
    });
  }

  function decrementItem(itemId: string) {
    setCart((previous) => {
      const entry = previous[itemId];
      if (!entry) return previous;
      if (entry.qty === 1) {
        const { [itemId]: _, ...rest } = previous;
        return rest;
      }
      return {
        ...previous,
        [itemId]: { ...entry, qty: entry.qty - 1 }
      };
    });
  }

  function incrementItem(itemId: string) {
    setCart((previous) => {
      const entry = previous[itemId];
      if (!entry) return previous;
      return {
        ...previous,
        [itemId]: { ...entry, qty: entry.qty + 1 }
      };
    });
  }

  async function placeOrder() {
    setError("");
    setSuccess("");

    const items = Object.entries(cart).map(([menu_item_id, item]) => ({ menu_item_id, qty: item.qty }));
    if (!tableId) {
      setError("Please select a table.");
      return;
    }
    if (!items.length) {
      setError("Cart is empty.");
      return;
    }

    try {
      setIsSubmitting(true);
      const order = await createOrder({ table_id: tableId, items });
      let paymentStatus = order.payment_status;

      if (paymentMethod !== "cash") {
        const paid = await payOrder({
          order_id: order.id,
          amount_cents: order.total_cents,
          provider: paymentMethod
        });
        paymentStatus = paid.payment_status;
      }

      setCart({});
      setCartOpen(false);
      setActiveOrderId(order.id);
      const paymentMessage = paymentMethod === "cash" ? "Cash selected. Please pay at counter." : `Payment ${paymentStatus}.`;
      setSuccess(`Order ${order.order_number} placed. Total ${centsToCurrency(order.total_cents)}. ${paymentMessage}`);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Order failed.");
    } finally {
      setIsSubmitting(false);
    }
  }

  function resetForNewOrder() {
    setActiveOrderId("");
    setActiveOrder(null);
    setSuccess("");
    setError("");
  }

  async function callWaiter(currentTableId?: string) {
    const targetTableId = currentTableId ?? tableId;
    if (!targetTableId) {
      setError("Select table first to call waiter.");
      return;
    }

    try {
      setIsCallingWaiter(true);
      setError("");
      await createStaffCall({ table_id: targetTableId, message: "Customer requested assistance." });
      setSuccess("Waiter called. Staff has been notified.");
    } catch (callError) {
      setError(callError instanceof Error ? callError.message : "Failed to call waiter.");
    } finally {
      setIsCallingWaiter(false);
    }
  }

  if (loading) {
    return (
      <main>
        <div className="card">Loading tablet app...</div>
      </main>
    );
  }

  if (activeOrderId) {
    const currentStatus = activeOrder?.status ?? "Placed";
    const currentIndex = STATUS_FLOW.indexOf(currentStatus as OrderStatus);

    return (
      <main>
        <div className="stack hero">
          <h1>Order Status</h1>
          <p className="small">Live updates from kitchen in real time.</p>
        </div>

        <section className="card stack">
          <div className="row">
            <div>
              <strong>{activeOrder?.order_number ?? activeOrderId}</strong>
              <div className="small">Table: {activeOrder?.table.display_name ?? "Loading..."}</div>
            </div>
            <span className={`status-pill status-${(currentStatus || "Placed").toLowerCase().replace(/\s+/g, "-")}`}>
              {currentStatus}
            </span>
          </div>

          {statusLoading && <div className="small">Refreshing status...</div>}

          <div className="status-flow">
            {STATUS_FLOW.map((status, index) => {
              const completed = index <= currentIndex;
              return (
                <div key={status} className={`status-step ${completed ? "done" : ""}`}>
                  <div className="dot" />
                  <span>{status}</span>
                </div>
              );
            })}
          </div>

          <div className="stack totals">
            <div className="row">
              <span>Subtotal</span>
              <strong>{centsToCurrency(activeOrder?.totals.subtotal_cents ?? 0)}</strong>
            </div>
            <div className="row">
              <span>Tax</span>
              <strong>{centsToCurrency(activeOrder?.totals.tax_cents ?? 0)}</strong>
            </div>
            <div className="row">
              <span>Tip</span>
              <strong>{centsToCurrency(activeOrder?.totals.tip_cents ?? 0)}</strong>
            </div>
            <div className="row">
              <span>Total</span>
              <strong>{centsToCurrency(activeOrder?.totals.total_cents ?? 0)}</strong>
            </div>
          </div>

          {currentStatus === "Ready for Pickup" && <div className="ready-banner">Your order is ready for pickup.</div>}

          <button className="primary" onClick={() => callWaiter(activeOrder?.table.id)} disabled={isCallingWaiter}>
            {isCallingWaiter ? "Calling..." : "Call Waiter"}
          </button>

          <button className="secondary" onClick={resetForNewOrder}>
            Start New Order
          </button>

          {success && <div className="status-ok">{success}</div>}
          {error && <div className="error">{error}</div>}
        </section>
      </main>
    );
  }

  return (
    <main>
      <div className="stack hero">
        <h1>Jungle Labs Mobile Ordering</h1>
        <p className="small">Menu, cart, table assignment, and instant order placement.</p>
      </div>

      <div className="grid">
        <section className="card stack">
          <div className="row section-head">
            <h2>Menu</h2>
            <div className="table-picker">
              <label className="small" htmlFor="table-select">
                Active Table
              </label>
              <select id="table-select" value={tableId} onChange={(event) => setTableId(event.target.value)}>
                <option value="">Select table</option>
                {tables.map((table) => (
                  <option key={table.id} value={table.id}>
                    {table.display_name} ({table.table_code})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {groupedMenu.map((group) => (
            <div key={group.categoryName} className="stack">
              <h3>{group.categoryName}</h3>
              {group.items.map((row) => (
                <div key={row.item_id} className="menu-item">
                  <div>
                    <div>{row.item_name}</div>
                    <div className="small">{row.description ?? "No description"}</div>
                  </div>
                  <div className="stack align-end">
                    <strong>{centsToCurrency(row.price_cents ?? 0)}</strong>
                    <button className="primary" onClick={() => addItem(row)}>
                      Add
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ))}
        </section>

        <aside className={`card stack cart-panel ${cartOpen ? "open" : ""}`}>
          <h2>Cart</h2>
          {!Object.keys(cart).length && <p className="small">No items yet.</p>}
          {Object.entries(cart).map(([itemId, item]) => (
            <div key={itemId} className="menu-item cart-item">
              <div>
                <div>{item.name}</div>
                <div className="small">{centsToCurrency(item.unitPriceCents)} each</div>
              </div>
              <div className="stack align-end">
                <div className="row">
                  <button className="secondary" onClick={() => decrementItem(itemId)}>
                    -
                  </button>
                  <strong>{item.qty}</strong>
                  <button className="secondary" onClick={() => incrementItem(itemId)}>
                    +
                  </button>
                </div>
                <div>{centsToCurrency(item.qty * item.unitPriceCents)}</div>
              </div>
            </div>
          ))}

          <div className="stack totals">
            <div className="row">
              <span>Subtotal</span>
              <strong>{centsToCurrency(subtotalCents)}</strong>
            </div>
            <div className="row">
              <span>Tax (13%)</span>
              <strong>{centsToCurrency(taxCents)}</strong>
            </div>
            <div className="row">
              <span>Total</span>
              <strong>{centsToCurrency(totalCents)}</strong>
            </div>
          </div>

          <div className="stack">
            <span className="small">Payment Method</span>
            <div className="payment-row">
              <button
                className={`secondary payment-btn ${paymentMethod === "tap" ? "selected" : ""}`}
                onClick={() => setPaymentMethod("tap")}
              >
                Tap
              </button>
              <button
                className={`secondary payment-btn ${paymentMethod === "qr" ? "selected" : ""}`}
                onClick={() => setPaymentMethod("qr")}
              >
                QR
              </button>
              <button
                className={`secondary payment-btn ${paymentMethod === "cash" ? "selected" : ""}`}
                onClick={() => setPaymentMethod("cash")}
              >
                Cash
              </button>
            </div>
          </div>

          <button className="primary" onClick={placeOrder} disabled={isSubmitting}>
            {isSubmitting ? "Placing..." : "Place Order"}
          </button>

          <button className="secondary" onClick={() => callWaiter()} disabled={isCallingWaiter}>
            {isCallingWaiter ? "Calling..." : "Call Waiter"}
          </button>

          {success && <div className="status-ok">{success}</div>}
          {error && <div className="error">{error}</div>}
        </aside>
      </div>

      <button className={`mobile-cart-btn ${cartOpen ? "active" : ""}`} onClick={() => setCartOpen((value) => !value)}>
        <span>Cart ({Object.keys(cart).length})</span>
        <strong>{centsToCurrency(totalCents)}</strong>
      </button>
    </main>
  );
}
