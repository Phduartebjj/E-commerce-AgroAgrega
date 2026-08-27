import { isPlatformBrowser } from '@angular/common';
import { effect, inject, Injectable, PLATFORM_ID, signal } from '@angular/core';
import { AddressModel } from '@models/address.model';

import { CartItemModel } from '@models/cartItem';
import { OrderModel, OrderPaymentMethod, OrderStatus } from '@models/order';

@Injectable({
  providedIn: 'root',
})
export class OrderService {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly keyOrders = 'client-orders';

  private readonly orders = signal<OrderModel[]>(this.getStorageOrders());

  constructor() {
    effect(() => {
      const orders = this.orders();

      if (!this.isBrowser()) {
        return;
      }

      localStorage.setItem(this.keyOrders, JSON.stringify(orders));
    });
  }

  getOrderById(id: string): OrderModel | undefined {
    return this.orders().find((order) => order.id === id);
  }

  getOrders() {
    return this.orders.asReadonly();
  }

  private isBrowser(): boolean {
    return isPlatformBrowser(this.platformId);
  }

  private getStorageOrders(): OrderModel[] {
    if (!this.isBrowser()) {
      return [];
    }

    const storage = localStorage.getItem(this.keyOrders);

    if (!storage) {
      return [];
    }

    try {
      return JSON.parse(storage) as OrderModel[];
    } catch (error) {
      console.error('Erro ao ler pedidos do localStorage:', error);
      return [];
    }
  }

  createOrder(
    cartItem: CartItemModel[],
    userId: string,
    subtotal: number,
    discount: number,
    shipping: number,
    paymentMethod: OrderPaymentMethod,
    address: AddressModel
  ): void {
    const newOrder: OrderModel = {
      id: globalThis.crypto.randomUUID(),
      userId,
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
      paymentMethod,
      address,
    };

    this.orders.update((orders) => [...orders, newOrder]);

    console.log('PEDIDO CRIADO:', newOrder);
    console.log('PEDIDOS NO SIGNAL:', this.orders());
    console.log('PEDIDOS NO LOCALSTORAGE:', localStorage.getItem(this.keyOrders));
  }
}
