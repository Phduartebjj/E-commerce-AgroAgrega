import { TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { describe, expect, it, vi } from 'vitest';
import { Auth } from '../auth/auth.service';
import { OrderPaymentMethod, OrderStatus } from '@models/order';
import { ProductModel } from '@models/product';

import { OrderService } from './order.service';

describe('OrderService', () => {
  let service: OrderService;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({});
    service = TestBed.inject(OrderService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('deve criar, consultar e cancelar um pedido autenticado', () => {
    const userId = signal('user-1');
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [OrderService, { provide: Auth, useValue: { currentUserId: userId } }],
    });
    service = TestBed.inject(OrderService);
    const product: ProductModel = {
      id: 'product-1',
      title: 'Produto',
      price: 20,
      description: 'Descrição',
      category: 'Ferramentas',
      weeklySales: 1,
      rating: 4,
      images: ['produto.png'],
    };

    service.createOrder(
      [{ product, quantity: 2 }],
      'Cliente',
      40,
      5,
      10,
      OrderPaymentMethod.Pix,
      {
        id: 'address-1',
        fullName: 'Cliente',
        cep: '12345-678',
        address: 'Rua A',
        number: '10',
        neighborhood: 'Centro',
        city: 'São Paulo',
        state: 'SP',
      },
    );

    const orders = service.getOrders()();
    expect(orders).toHaveLength(1);
    expect(orders[0]).toMatchObject({
      userId: 'user-1',
      total: 45,
      status: OrderStatus.Pending,
      items: [{ productId: 'product-1', quantity: 2, subtotal: 40, imgSrc: 'produto.png' }],
    });
    expect(service.getOrderById(orders[0].id)).toEqual(orders[0]);
    expect(service.getOrdersByUserId('user-1')).toEqual(orders);

    service.cancelOrder(orders[0].id);
    expect(service.getOrderById(orders[0].id)?.status).toBe(OrderStatus.Cancelled);
  });

  it('deve restaurar pedidos persistidos e normalizar imagens', async () => {
    const userId = signal<string | null>('user-2');
    localStorage.setItem(
      'client-orders-user-2',
      JSON.stringify([
        {
          id: 'order-2',
          userId: 'user-2',
          customerName: 'Cliente',
          items: [{ imgSrc: 'produto.jpg', productId: 'p', name: 'Produto', price: 1, quantity: 1, subtotal: 1 }],
          subtotal: 1,
          discount: 0,
          shipping: 0,
          total: 1,
          status: OrderStatus.Delivered,
          createdAt: '2026-01-01',
          paymentMethod: OrderPaymentMethod.Pix,
          address: {} as never,
        },
      ]),
    );
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [OrderService, { provide: Auth, useValue: { currentUserId: userId } }],
    });
    service = TestBed.inject(OrderService);
    userId.set(null);
    userId.set('user-2');
    TestBed.flushEffects();

    expect(service.getOrders()()[0].items[0].imgSrc).toBe('/produto.webp');
    expect(service.getOrdersByUserId('missing')).toEqual([]);
  });

  it('deve ignorar criação sem autenticação e storage inválido', () => {
    const userId = signal<string | null>(null);
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [OrderService, { provide: Auth, useValue: { currentUserId: userId } }],
    });
    service = TestBed.inject(OrderService);
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined);

    service.createOrder([], 'Cliente', 0, 0, 0, OrderPaymentMethod.Pix, {} as never);
    expect(service.getOrders()()).toEqual([]);
    expect(service.getOrdersByUserId('')).toEqual([]);

    userId.set('user-3');
    localStorage.setItem('client-orders-user-3', '{invalid');
    expect(service.getOrders()()).toEqual([]);
    consoleError.mockRestore();
  });
});
