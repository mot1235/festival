export interface Order {
  id: number;
  orderNumber: number;
  quantity: number;
  status: "pending" | "ready" | "completed";
  createdAt: string;
}
