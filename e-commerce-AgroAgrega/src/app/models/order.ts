import { AddressModel } from './address.model';

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
  paymentMethod: OrderPaymentMethod;
  address: AddressModel;
}

export enum OrderStatus {
  Pending = 'Pendente',
  Confirmed = 'Confirmado',
  Shipped = 'À caminho',
  Delivered = 'Entregue',
  Cancelled = 'Cancelado',
}

export enum OrderPaymentMethod {
  CreditCard = 'Cartão de Crédito',
  DebitCard = 'Cartão de Débito',
  Pix = 'Pix',
  Boleto = 'Boleto',
}

export interface OrderItemModel {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  subtotal: number;
}
