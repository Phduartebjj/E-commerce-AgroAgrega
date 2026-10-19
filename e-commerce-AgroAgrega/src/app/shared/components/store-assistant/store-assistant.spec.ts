import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { vi } from 'vitest';

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
    vi.useFakeTimers();
  });

  afterEach(() => {
    fixture.destroy();
    vi.useRealTimers();
    vi.unstubAllGlobals();
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

  it('loads the assistant before typing the welcome and each shortcut in order', () => {
    const host = fixture.nativeElement as HTMLElement;
    host.querySelector<HTMLButtonElement>('.assistant-launcher')?.click();
    fixture.detectChanges();

    expect(component.isStarting()).toBe(true);
    expect(host.querySelector('.assistant-startup')?.textContent).toContain('Iniciando o Tourino');
    expect(host.querySelector('.assistant-composer')?.hasAttribute('inert')).toBe(true);

    vi.advanceTimersByTime(4999);
    fixture.detectChanges();
    expect(component.isStarting()).toBe(true);

    vi.advanceTimersByTime(1);
    fixture.detectChanges();
    expect(component.isStarting()).toBe(false);
    expect(component.isIntroducing()).toBe(true);
    expect(host.querySelector('.assistant-startup')).toBeNull();

    vi.advanceTimersByTime(350);
    fixture.detectChanges();
    expect(component.introGreeting().length).toBeGreaterThan(0);
    expect(component.introDescription()).toBe('');
    expect(host.querySelectorAll('.assistant-suggestion--pending')).toHaveLength(5);

    vi.advanceTimersByTime(5000);
    fixture.detectChanges();
    expect(component.isIntroducing()).toBe(false);
    expect(host.querySelectorAll('.assistant-suggestion--pending')).toHaveLength(0);
    expect(host.querySelector('.assistant-composer')?.hasAttribute('inert')).toBe(false);
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
    vi.advanceTimersByTime(4000);
    expect(component.messages().at(-1)?.products?.length).toBeGreaterThan(0);
  });

  it('adds, updates and removes the actual cart item', async () => {
    await component.submitPrompt('Adicionar 2 roçadeiras ao carrinho');
    vi.advanceTimersByTime(4000);
    expect(cart.totalCartItens()).toBe(2);
    expect(cart.getCartItems()()[0].product.title).toContain('Roçadeira');

    await component.submitPrompt('Ajustar quantidade de roçadeira para 3');
    vi.advanceTimersByTime(4000);
    expect(cart.totalCartItens()).toBe(3);

    await component.submitPrompt('Remover roçadeira do carrinho');
    vi.advanceTimersByTime(4000);
    expect(cart.isEmpty()).toBe(true);
  });

  it('applies a valid coupon without inventing an invalid one', async () => {
    await component.submitPrompt('Aplicar cupom CAMPO15');
    vi.advanceTimersByTime(4000);
    expect(cart.coupon()?.code).toBe('CAMPO15');
    await component.submitPrompt('Aplicar cupom INEXISTENTE');
    vi.advanceTimersByTime(4000);
    expect(cart.coupon()?.code).toBe('CAMPO15');
  });

  it('shows typing dots, reveals the reply gradually and then displays its actions', () => {
    component.open.set(true);
    component.submitPrompt('Ver cupons');
    fixture.detectChanges();
    const host = fixture.nativeElement as HTMLElement;
    const reply = 'Confira os cupons disponíveis. Escolha um para aplicar ao carrinho:';

    expect(component.isTyping()).toBe(true);
    expect(component.messages().at(-1)?.text).toBe('');
    expect(host.querySelector('.assistant-typing')).not.toBeNull();
    expect(host.querySelector('.assistant-messages')?.getAttribute('aria-busy')).toBe('true');
    expect(host.querySelector('.assistant-coupons')).toBeNull();

    vi.advanceTimersByTime(620);
    fixture.detectChanges();
    const partialReply = component.messages().at(-1)?.text ?? '';
    expect(partialReply.length).toBeGreaterThan(0);
    expect(partialReply.length).toBeLessThan(reply.length);
    expect(reply.startsWith(partialReply)).toBe(true);
    expect(host.querySelector('.assistant-cursor')).not.toBeNull();
    expect(host.querySelector('.assistant-coupons')).toBeNull();

    vi.advanceTimersByTime(4000);
    fixture.detectChanges();
    expect(component.messages().at(-1)?.text).toBe(reply);
    expect(component.isTyping()).toBe(false);
    expect(host.querySelector('.assistant-messages')?.getAttribute('aria-busy')).toBe('false');
    expect(host.querySelector('.assistant-cursor')).toBeNull();
    expect(host.querySelector('.assistant-coupons')).not.toBeNull();
  });

  it('preserves the next draft and prevents overlapping replies while typing', () => {
    component.draft = 'Ver cupons';
    component.send();
    component.draft = 'Ver ofertas de hoje';
    component.send();
    component.submitPrompt('Meu carrinho');
    component.applyCoupon('CAMPO15');
    expect(component.messages()).toHaveLength(3);
    expect(component.draft).toBe('Ver ofertas de hoje');
    expect(cart.coupon()).toBeNull();

    vi.advanceTimersByTime(4000);
    component.send();
    expect(component.draft).toBe('');
    expect(component.messages()).toHaveLength(5);
    vi.advanceTimersByTime(4000);
    expect(component.messages().at(-1)?.products?.length).toBeGreaterThan(0);
  });

  it('cancels the typing timer when the component is destroyed', () => {
    component.submitPrompt('Ver cupons');
    vi.advanceTimersByTime(620);
    const messages = component.messages();
    fixture.destroy();
    vi.advanceTimersByTime(4000);
    expect(component.messages()).toBe(messages);
  });

  it('displays the full reply immediately when reduced motion is preferred', () => {
    vi.stubGlobal('matchMedia', () => ({ matches: true }));
    component.submitPrompt('Ver cupons');
    expect(component.isTyping()).toBe(false);
    expect(component.messages().at(-1)?.showCoupons).toBe(true);
    expect(component.messages().at(-1)?.text).toContain('Confira os cupons');
  });
});
