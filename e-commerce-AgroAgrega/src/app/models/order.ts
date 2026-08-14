import { CartItemModel } from './cartItem';

export interface OrderInterface {
  id: string;
  userId: number;
  items: CartItemModel;
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
