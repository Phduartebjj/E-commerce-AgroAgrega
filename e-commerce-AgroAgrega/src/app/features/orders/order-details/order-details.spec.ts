import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OrderDetails } from './order-details';

describe('OrderDetails', () => {
  let component: OrderDetails;
  let fixture: ComponentFixture<OrderDetails>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [OrderDetails],
    }).compileComponents();

    fixture = TestBed.createComponent(OrderDetails);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
