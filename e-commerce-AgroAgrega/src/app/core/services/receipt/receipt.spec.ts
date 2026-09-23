import { TestBed } from '@angular/core/testing';
import { describe, expect, it, vi } from 'vitest';

const JsPDFMock = vi.hoisted(() => class {
  internal = { pageSize: { getWidth: () => 210 } };
  setFont() { return this; }
  setFontSize() { return this; }
  text() { return this; }
  setDrawColor() { return this; }
  setLineWidth() { return this; }
  line() { return this; }
  setFillColor() { return this; }
  rect() { return this; }
  save() { return this; }
});

vi.mock('jspdf', () => ({ jsPDF: JsPDFMock }));

import { ReceiptService } from './receipt';

describe('Receipt', () => {
  let service: ReceiptService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ReceiptService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('deve gerar comprovante com itens longos e endereço completo', () => {
    const order = {
      id: 'order-1',
      userId: 'user-1',
      customerName: 'Cliente',
      items: [
        {
          imgSrc: 'produto.webp',
          productId: 'product-1',
          name: 'Produto com nome suficientemente longo para ser truncado no comprovante',
          price: 25.5,
          quantity: 2,
          subtotal: 51,
        },
        {
          imgSrc: 'produto-2.webp',
          productId: 'product-2',
          name: 'Segundo produto',
          price: 10,
          quantity: 1,
          subtotal: 10,
        },
      ],
      subtotal: 61,
      discount: 5,
      shipping: 8,
      total: 64,
      status: 'Confirmado',
      createdAt: '2026-09-20T12:00:00.000Z',
      paymentMethod: 'Pix',
      address: {
        id: 'address-1',
        fullName: 'Cliente AgroAgrega',
        cep: '12345-678',
        address: 'Rua das Flores',
        number: '10',
        neighborhood: 'Centro',
        city: 'São Paulo',
        state: 'SP',
        complement: 'Apartamento 2',
      },
    } as never;

    service.generateReceipt(order);
    expect(service).toBeTruthy();
  });
});
