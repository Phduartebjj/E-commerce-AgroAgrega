import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OrderDetailsCard } from './order-details-card';

describe('OrderDetailsCard', () => {
  let component: OrderDetailsCard;
  let fixture: ComponentFixture<OrderDetailsCard>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [OrderDetailsCard],
    }).compileComponents();

    fixture = TestBed.createComponent(OrderDetailsCard);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('item', {
      imgSrc: 'assets/images/products/milho-hibrido.jpg',
      productId: 'product-1',
      name: 'Produto de teste',
      price: 10,
      quantity: 2,
      subtotal: 20,
    });
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
