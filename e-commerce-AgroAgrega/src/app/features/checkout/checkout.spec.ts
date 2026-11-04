import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { Cart } from '@core/services/cart/cart.service';
import { Auth } from '@core/services/auth/auth.service';
import { ProductService } from '@core/services/product/product.service';
import { OrderService } from '@core/services/order/order.service';
import { PaymentApiService } from '@core/services/payment-api.service';
import { vi } from 'vitest';

import {
  addBusinessDays,
  CheckoutComponent,
  formatDigitableLine,
  getDeliveryEstimate,
} from './checkout';

// Verifica o checkout, o cálculo de entrega e a formatação do boleto.
describe('Checkout', () => {
  let component: CheckoutComponent;
  let fixture: ComponentFixture<CheckoutComponent>;

  beforeEach(async () => {
    localStorage.clear();
    document.cookie = 'auth_token=; max-age=0; path=/';
    await TestBed.configureTestingModule({
      imports: [CheckoutComponent],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(CheckoutComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('calculates a future delivery window using business days', () => {
    const monday = new Date(2026, 8, 14, 12);

    expect(addBusinessDays(monday, 5).getDate()).toBe(21);
    expect(getDeliveryEstimate(monday)).toContain('21 de setembro de 2026');
    expect(getDeliveryEstimate(monday)).toContain('24 de setembro de 2026');
  });

  it('formats a 47 digit boleto line', () => {
    const line = formatDigitableLine('12345678901234567890123456789012345678901234567');

    expect(line.replace(/\D/g, '')).toHaveLength(47);
    expect(line).toContain('.');
  });

  it('generates new Pix and boleto payment codes automatically', () => {
    component.selectPaymentMethod(component.PaymentMethod.Pix);
    expect(component.pixCopyPasteCode).toContain('PIX-DEMONSTRACAO');

    component.selectPaymentMethod(component.PaymentMethod.Boleto);
    expect(component.boletoBarcodeValue).toHaveLength(44);
    expect(component.boletoDigitableLine.replace(/\D/g, '')).toHaveLength(47);
  });

  it('não deixa dados inválidos do cartão bloquearem a escolha do Pix', () => {
    component.selectPaymentMethod(component.PaymentMethod.CreditCard);
    component.checkoutForm.controls.cardNumber.setValue('123');
    expect(component.checkoutForm.controls.cardNumber.invalid).toBe(true);
    component.selectPaymentMethod(component.PaymentMethod.Pix);
    expect(component.checkoutForm.controls.cardNumber.disabled).toBe(true);
    expect(component.states).toContain('SP');
  });

  it('conclui o cartão demonstrativo sem chamar uma API externa e sem criar pedido vazio', () => {
    vi.spyOn(component.router, 'navigate').mockResolvedValue(true);
    const cart = TestBed.inject(Cart);
    const orders = TestBed.inject(OrderService);
    TestBed.inject(Auth).register('Pessoa Teste', 'checkout@example.test', 'Teste123!');
    fixture.detectChanges();
    cart.addCartItem(TestBed.inject(ProductService).getProducts()()[0]);
    const request = vi.spyOn(TestBed.inject(PaymentApiService), 'criarPedidoTeste');
    component.selectPaymentMethod(component.PaymentMethod.CreditCard);
    component.checkoutForm.patchValue({ fullName: 'Pessoa Teste', cep: '01310100', cellPhone: '11988887777',
      address: 'Avenida Paulista', number: '100', neighborhood: 'Bela Vista', city: 'São Paulo', state: 'SP',
      cardNumber: '4111111111111111', cardName: 'PESSOA TESTE', cardExpiration: '12/35', cardCvv: '123', cardCpf: '52998224725', installments: 2 });
    expect(component.checkoutForm.valid).toBe(true);
    component.finishOrder();
    expect(request).not.toHaveBeenCalled();
    expect(orders.getOrders()()).toHaveLength(1);
    expect(cart.isEmpty()).toBe(true);
    component.finishOrder();
    expect(orders.getOrders()()).toHaveLength(1);
    expect(component.checkoutError).toContain('pelo menos um produto');
  });
});
