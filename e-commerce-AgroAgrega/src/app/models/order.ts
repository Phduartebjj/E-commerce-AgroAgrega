export interface OrderModel {
  id: string;
  userId: string;
  items: OrderItemModel[];
  subtotal: number;
  discount: number;
  shipping: number;
  total: number;
  status: OrderStatus;
  createdAt: string;
}

export enum OrderStatus {
  Pending = 'Pendente',
  Confirmed = 'Confirmado',
  Shipped = 'À caminho',
  Delivered = 'Entregue',
  Cancelled = 'Cancelado',
}

export interface OrderItemModel {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  subtotal: number;
}
