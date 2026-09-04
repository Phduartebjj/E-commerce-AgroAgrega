import { isPlatformBrowser } from '@angular/common';
import { effect, inject, Injectable, PLATFORM_ID, signal } from '@angular/core';
import { AddressModel } from '@models/address.model';

import { CartItemModel } from '@models/cartItem';
import { OrderModel, OrderPaymentMethod, OrderStatus } from '@models/order';
import { Auth } from '../auth/auth.service';

@Injectable({
  providedIn: 'root',
})
export class OrderService {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly keyOrders = 'client-orders';
  private readonly auth = inject(Auth);
  private readonly orders = signal<OrderModel[]>([]);

  constructor() {
    effect(() => {
      const userId = this.auth.currentUserId();

      if (!this.isBrowser()) {
        return;
      }

      if (!userId) {
        this.orders.set([]);
        return;
      }

      this.orders.set(this.getStorageOrders());
    });
    effect(() => {
      const userId = this.auth.currentUserId();
      const orders = this.orders();

      if (!this.isBrowser() || !userId) {
        return;
      }

      const key = this.getStorageKey();

      if (!key) {
        return;
      }

      localStorage.setItem(key, JSON.stringify(orders));
    });
  }

  getOrderById(id: string): OrderModel | undefined {
    return this.orders().find((order) => order.id === id);
  }

  getOrders() {
    return this.orders.asReadonly();
  }

  getOrdersByUserId(userId: string): OrderModel[] {
    if (!userId) {
      return [];
    }

    return this.orders().filter((order) => order.userId === userId);
  }

  private isBrowser(): boolean {
    return isPlatformBrowser(this.platformId);
  }

  private getStorageKey(): string | null {
    const userId = this.auth.currentUserId();

    if (!userId) {
      return null;
    }

    return `${this.keyOrders}-${userId}`;
  }

  private getStorageOrders(): OrderModel[] {
    if (!this.isBrowser()) {
      return [];
    }

    const key = this.getStorageKey();

    if (!key) {
      return [];
    }

    const storage = localStorage.getItem(key);

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

  cancelOrder(orderId: string): void {
    this.orders.update((orders) => {
      return orders.map((order) => {
        if (order.id === orderId) {
          return { ...order, status: OrderStatus.Cancelled };
        }
        return order;
      });
    });
  }

  createOrder(
    cartItem: CartItemModel[],
    customerName: string,
    subtotal: number,
    discount: number,
    shipping: number,
    paymentMethod: OrderPaymentMethod,
    address: AddressModel,
  ): void {
    const userId = this.auth.currentUserId();

    if (!userId) {
      console.error('Usuário não autenticado. Não é possível criar o pedido.');
      return;
    }

    const newOrder: OrderModel = {
      id: globalThis.crypto.randomUUID(),
      userId,
      customerName,
      items: cartItem.map((item) => ({
        imgSrc: item.product.images[0],
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
    const key = this.getStorageKey();

    console.log('PEDIDO CRIADO:', newOrder);
    console.log('PEDIDOS NO SIGNAL:', this.orders());
    console.log(
      'PEDIDOS NO LOCALSTORAGE:',
      key ? localStorage.getItem(key) : 'Chave de armazenamento não encontrada',
    );
  }
}
