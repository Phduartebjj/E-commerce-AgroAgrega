import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { OrderDetails } from './order-details';

// Verifica se a página de detalhes do pedido é criada corretamente.
describe('OrderDetails', () => {
  let component: OrderDetails;
  let fixture: ComponentFixture<OrderDetails>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [OrderDetails],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(OrderDetails);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
