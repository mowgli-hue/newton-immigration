"use client";

import { useEffect, useMemo, useState } from "react";
import {
  fetchKdsOrders,
  fetchStaffCalls,
  getWsBase,
  resolveStaffCall,
  updateOrderStatus,
  type KdsOrder,
  type StaffCall
} from "../lib/api";

const FLOW: KdsOrder["status"][] = ["Placed", "Accepted", "Preparing", "Ready for Pickup", "Completed"];

function centsToCurrency(cents: number) {
  return new Intl.NumberFormat("en-CA", {
    style: "currency",
    currency: "CAD"
  }).format(cents / 100);
}

function nextStatuses(current: KdsOrder["status"]) {
  const idx = FLOW.indexOf(current);
  return FLOW.slice(idx + 1);
}

export default function KdsPage() {
  const [orders, setOrders] = useState<KdsOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [includeCompleted, setIncludeCompleted] = useState(false);
  const [updatingOrderId, setUpdatingOrderId] = useState("");
  const [staffCalls, setStaffCalls] = useState<StaffCall[]>([]);
  const [resolvingCallId, setResolvingCallId] = useState("");

  async function loadData(currentIncludeCompleted: boolean) {
    try {
      const [rows, calls] = await Promise.all([
        fetchKdsOrders(currentIncludeCompleted),
        fetchStaffCalls(currentIncludeCompleted)
      ]);
      setOrders(rows);
      setStaffCalls(calls);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Failed to load KDS orders");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    setLoading(true);
    setError("");
    loadData(includeCompleted);
  }, [includeCompleted]);

  useEffect(() => {
    const socket = new WebSocket(`${getWsBase()}/ws`);

    socket.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data) as { event?: string };
        if (
          message.event === "order.created" ||
          message.event === "order.status_changed" ||
          message.event === "staff_call.created" ||
          message.event === "staff_call.resolved"
        ) {
          loadData(includeCompleted);
        }
      } catch {
        return;
      }
    };

    return () => socket.close();
  }, [includeCompleted]);

  const activeOrders = useMemo(
    () => orders.filter((order) => includeCompleted || order.status !== "Completed"),
    [orders, includeCompleted]
  );

  async function handleStatusUpdate(orderId: string, status: KdsOrder["status"]) {
    try {
      setUpdatingOrderId(orderId);
      await updateOrderStatus(orderId, status);
      await loadData(includeCompleted);
    } catch (updateError) {
      setError(updateError instanceof Error ? updateError.message : "Status update failed");
    } finally {
      setUpdatingOrderId("");
    }
  }

  async function handleResolveStaffCall(callId: string) {
    try {
      setResolvingCallId(callId);
      await resolveStaffCall(callId);
      await loadData(includeCompleted);
    } catch (resolveError) {
      setError(resolveError instanceof Error ? resolveError.message : "Failed to resolve staff call");
    } finally {
      setResolvingCallId("");
    }
  }

  return (
    <main>
      <div className="stack">
        <div className="row">
          <div>
            <h1>Kitchen Display System</h1>
            <div className="small">Live incoming orders with one-tap status actions.</div>
          </div>
          <button className="secondary" onClick={() => setIncludeCompleted((value) => !value)}>
            {includeCompleted ? "Hide Completed" : "Show Completed"}
          </button>
        </div>

        {error && <div className="card" style={{ borderColor: "#c67878", color: "#a33232" }}>{error}</div>}

        <section className="card stack">
          <div className="row">
            <h2>Waiter Calls</h2>
            <span className="small">{staffCalls.filter((call) => call.status !== "resolved").length} open</span>
          </div>
          {staffCalls.length === 0 ? (
            <div className="small">No waiter calls.</div>
          ) : (
            <div className="stack">
              {staffCalls.map((call) => (
                <div key={call.id} className="row waiter-row">
                  <div className="stack" style={{ gap: 2 }}>
                    <strong>{call.display_name} ({call.table_code})</strong>
                    <span className="small">{new Date(call.opened_at).toLocaleTimeString()} - {call.status}</span>
                    {call.message ? <span className="small">{call.message}</span> : null}
                  </div>
                  {call.status !== "resolved" ? (
                    <button
                      className="primary"
                      onClick={() => handleResolveStaffCall(call.id)}
                      disabled={resolvingCallId === call.id}
                    >
                      {resolvingCallId === call.id ? "Resolving..." : "Resolve"}
                    </button>
                  ) : (
                    <span className="badge completed">Resolved</span>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>

        {loading ? (
          <div className="card">Loading orders...</div>
        ) : activeOrders.length === 0 ? (
          <div className="card empty">No active orders.</div>
        ) : (
          <div className="grid section-space">
            {activeOrders.map((order) => (
              <article key={order.id} className="card stack">
                <div className="order-head">
                  <div className="stack" style={{ gap: 4 }}>
                    <strong>{order.order_number}</strong>
                    <span className="small">{order.display_name} ({order.table_code})</span>
                    <span className="small">Placed: {new Date(order.placed_at).toLocaleTimeString()}</span>
                  </div>
                  <span className={`badge ${order.status === "Ready for Pickup" ? "ready" : order.status === "Completed" ? "completed" : ""}`}>
                    {order.status}
                  </span>
                </div>

                <div className="items stack">
                  {order.items.map((item) => (
                    <div key={item.order_item_id} className="item-row">
                      <span>
                        {item.qty}x {item.name}
                      </span>
                      <strong>{centsToCurrency(item.line_total_cents)}</strong>
                    </div>
                  ))}
                  <div className="row" style={{ borderTop: "1px solid var(--line)", paddingTop: 8 }}>
                    <span>Total</span>
                    <strong>{centsToCurrency(order.total_cents)}</strong>
                  </div>
                </div>

                <div className="status-grid">
                  {nextStatuses(order.status).map((status) => (
                    <button
                      key={status}
                      className="primary status-btn"
                      onClick={() => handleStatusUpdate(order.id, status)}
                      disabled={updatingOrderId === order.id}
                    >
                      {updatingOrderId === order.id ? "Updating..." : status}
                    </button>
                  ))}
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
