import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { Cart } from '../../../core/services/cart/cart.service';
import { StoreAssistant } from './store-assistant';

describe('StoreAssistant', () => {
  let fixture: ComponentFixture<StoreAssistant>;
  let component: StoreAssistant;
  let cart: Cart;

  beforeEach(async () => {
    localStorage.clear();
    await TestBed.configureTestingModule({
      imports: [StoreAssistant],
      providers: [provideRouter([])],
    }).compileComponents();
    fixture = TestBed.createComponent(StoreAssistant);
    component = fixture.componentInstance;
    cart = TestBed.inject(Cart);
    fixture.detectChanges();
  });

  it('opens a floating chat with the provided mascot', () => {
    const launcher = fixture.nativeElement.querySelector('.assistant-launcher') as HTMLButtonElement;
    expect(launcher.getAttribute('aria-expanded')).toBe('false');
    launcher.click();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('[role="dialog"]')).not.toBeNull();
    expect(fixture.nativeElement.querySelector('.assistant-face')).not.toBeNull();
  });

  it('finds real offers and products from the catalog', () => {
    component.submitPrompt('Ver ofertas de hoje');
    expect(component.messages().at(-1)?.products?.length).toBeGreaterThan(0);
    component.submitPrompt('Buscar sensor de umidade');
    expect(component.messages().at(-1)?.products?.[0].title).toContain('Sensor de Umidade');
  });

  it('adds, updates and removes the actual cart item', () => {
    component.submitPrompt('Adicionar 2 roçadeiras ao carrinho');
    expect(cart.totalCartItens()).toBe(2);
    expect(cart.getCartItems()()[0].product.title).toContain('Roçadeira');

    component.submitPrompt('Ajustar quantidade de roçadeira para 3');
    expect(cart.totalCartItens()).toBe(3);

    component.submitPrompt('Remover roçadeira do carrinho');
    expect(cart.isEmpty()).toBe(true);
  });

  it('applies a valid coupon without inventing an invalid one', () => {
    component.submitPrompt('Aplicar cupom CAMPO15');
    expect(cart.coupon()?.code).toBe('CAMPO15');
    component.submitPrompt('Aplicar cupom INEXISTENTE');
    expect(cart.coupon()?.code).toBe('CAMPO15');
  });
});
