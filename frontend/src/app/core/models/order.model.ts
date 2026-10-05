export interface Address {
  street: string;
  city: string;
  zipCode: string;
  country: string;
  phone: string;
}

export interface OrderItem {
  productId: string;
  productName: string;
  price: number;
  quantity: number;
  imageUrl?: string;
}

export interface SubOrder {
  id: string;
  orderId: string;
  sellerId: string;
  items: OrderItem[];
  totalAmount: number;
  paymentMethod: string;
  statusHistory: StatusHistory[];
  status: OrderStatus;
  createdAt: string;
  updatedAt: string;
}

export interface Order {
  id: string;
  userId: string;
  totalAmount: number;
  shippingAddress: Address;
  paymentMethod: string;
  status: OrderStatus;
  subOrders: SubOrder[];
  createdAt: string;
  updatedAt: string;
}

export type OrderStatus =
  | "PENDING"
  | "CONFIRMED"
  | "SHIPPED"
  | "DELIVERED"
  | "CANCELLED";

export interface StatusHistory {
  status: OrderStatus;
  timestamp: string;
  changedBy: string;
}

export interface CreateOrderRequest {
  shippingAddress: Address;
  paymentMethod: string;
  totalAmount: number;
}

export interface CreateOrderResponse {
  id: string;
}
