export interface OrderModel {
  id: string;
  userId: number;
  items: OrderItemModel[];
  subtotal: number;
  discount: number;
  shipping: number;
  total: number;
  status: OrderStatus;
  createdAt: string;
}

export enum OrderStatus {
  Pending = 'pending',
  Confirmed = 'confirmed',
  Shipped = 'shipped',
  Delivered = 'delivered',
  Cancelled = 'cancelled',
}

export interface OrderItemModel {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  subtotal: number;
}
