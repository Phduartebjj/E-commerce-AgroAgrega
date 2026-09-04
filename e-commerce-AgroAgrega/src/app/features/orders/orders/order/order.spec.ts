import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { OrderComponent } from './order';
import { OrderStatus } from '../../../../models/order';

describe('OrderComponent', () => {
  let component: OrderComponent;
  let fixture: ComponentFixture<OrderComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [OrderComponent],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(OrderComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('order', {
      id: 'order-1',
      userId: 'user-1',
      items: [],
      subtotal: 10,
      discount: 0,
      shipping: 0,
      total: 10,
      status: OrderStatus.Pending,
      createdAt: '2026-01-01T00:00:00.000Z',
    });
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
