import { CartItem } from './cartItem';

export interface Order {
  id: string;
  userId: number;
  items: CartItem;
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
