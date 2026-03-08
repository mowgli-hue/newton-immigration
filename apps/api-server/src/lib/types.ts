export type OrderStatus =
  | "Placed"
  | "Accepted"
  | "Preparing"
  | "Ready for Pickup"
  | "Completed";

export const ORDER_STATUS_CHAIN: OrderStatus[] = [
  "Placed",
  "Accepted",
  "Preparing",
  "Ready for Pickup",
  "Completed"
];
