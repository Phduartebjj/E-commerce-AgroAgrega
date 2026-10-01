import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { Cart } from '../../../core/services/cart/cart.service';
import { StoreAssistant } from './store-assistant';

// Verifica a interação do assistente com ofertas, produtos e carrinho.
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
    const launcher = fixture.nativeElement.querySelector(
      '.assistant-launcher',
    ) as HTMLButtonElement;
    expect(launcher.getAttribute('aria-expanded')).toBe('false');
    launcher.click();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('[role="dialog"]')).not.toBeNull();
    expect(fixture.nativeElement.querySelector('.assistant-header img')?.getAttribute('src')).toBe(
      'assets/images/assistant/tourino-header.png',
    );
    expect(fixture.nativeElement.querySelector('.assistant-message--welcome')).not.toBeNull();
    expect(fixture.nativeElement.textContent).toContain('Tourino');
  });

  it('offers the five visual shortcuts from the Tourino welcome screen', async () => {
    component.open.set(true);
    fixture.detectChanges();

    const shortcuts = [
      ...(fixture.nativeElement as HTMLElement).querySelectorAll<HTMLButtonElement>(
        '.assistant-suggestions button',
      ),
    ];
    expect(shortcuts).toHaveLength(5);
    expect(shortcuts.map((button) => button.textContent?.trim())).toEqual(
      expect.arrayContaining([
        expect.stringContaining('Buscar produtos'),
        expect.stringContaining('Ver ofertas de hoje'),
        expect.stringContaining('Ver cupons'),
        expect.stringContaining('Meu carrinho'),
        expect.stringContaining('Buscar sementes e fertilizantes'),
      ]),
    );

    await component.submitPrompt('Ver ofertas de hoje');
    expect(component.messages().at(-1)?.products?.length).toBeGreaterThan(0);
  });

  it('adds, updates and removes the actual cart item', async () => {
    await component.submitPrompt('Adicionar 2 roçadeiras ao carrinho');
    expect(cart.totalCartItens()).toBe(2);
    expect(cart.getCartItems()()[0].product.title).toContain('Roçadeira');

    await component.submitPrompt('Ajustar quantidade de roçadeira para 3');
    expect(cart.totalCartItens()).toBe(3);

    await component.submitPrompt('Remover roçadeira do carrinho');
    expect(cart.isEmpty()).toBe(true);
  });

  it('applies a valid coupon without inventing an invalid one', async () => {
    await component.submitPrompt('Aplicar cupom CAMPO15');
    expect(cart.coupon()?.code).toBe('CAMPO15');
    await component.submitPrompt('Aplicar cupom INEXISTENTE');
    expect(cart.coupon()?.code).toBe('CAMPO15');
  });

});
