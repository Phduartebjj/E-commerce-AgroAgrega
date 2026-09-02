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
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
