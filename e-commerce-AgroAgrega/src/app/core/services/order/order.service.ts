import { Injectable, signal } from '@angular/core';
import { CartItemModel } from '@models/cartItem';
import { OrderItemModel, OrderModel, OrderStatus } from '@models/order';

@Injectable({
  providedIn: 'root',
})
export class OrderService {
  private orders = signal<OrderModel[]>([]);

  getOrders() {
    return this.orders.asReadonly();
  }

  createOrder(
    cartItem: CartItemModel[],
    userId: string,
    subtotal: number,
    discount: number,
    shipping: number,
  ): void {
    const newOrder: OrderModel = {
      id: globalThis.crypto.randomUUID(),
      userId: userId,
      items: cartItem.map((item) => ({
        productId: item.product.id,
        name: item.product.title,
        price: item.product.price,
        quantity: item.quantity,
        subtotal: item.product.price * item.quantity,
      })),

      subtotal,
      discount,
      shipping,
      total: subtotal - discount + shipping,
      status: OrderStatus.Pending,
      createdAt: new Date().toISOString(),
    };
    this.orders.update((orders) => [...orders, newOrder]);
  }
}
