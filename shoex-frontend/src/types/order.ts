export interface Order {
  id: string;
  userId: string;
  items: import("./cart").CartItem[];
  total: number;
  status: "pending" | "processing" | "shipped" | "delivered" | "cancelled";
  createdAt: string;
  shippingAddress: {
    name: string;
    address: string;
    city: string;
    country: string;
    zip: string;
  };
}