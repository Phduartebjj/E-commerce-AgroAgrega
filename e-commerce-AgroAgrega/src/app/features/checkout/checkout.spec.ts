import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

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
});
