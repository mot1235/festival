export interface OrderItem {
  id?: number;
  productName: string;
  quantity: number;
  price?: number;
  flavor?: string; // 味の追加 (例: 'シナモン', 'シュガー', 'チョコ')
}

export interface Order {
  id: number;
  orderNumber: number;
  quantity: number;
  totalPrice?: number;
  status: "pending" | "ready" | "completed";
  createdAt: string;
  items?: OrderItem[];
}