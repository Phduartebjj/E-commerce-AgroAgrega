import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { vi } from 'vitest';

import { Cart } from '../../../core/services/cart/cart.service';
import { StoreAssistant } from './store-assistant';
import { StoreAssistantState } from './store-assistant-state';
import { calculatePixPrice } from '../../utils/product-card-display';
import { Auth } from '../../../core/services/auth/auth.service';
import { OrderService } from '../../../core/services/order/order.service';
import { OrderStatus, OrderPaymentMethod } from '../../../models/order';

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

  it('opens a floating chat with the mascot hidden until the agent finishes loading', () => {
    expect(fixture.nativeElement.querySelector('.assistant-launcher')).toBeNull();
    TestBed.inject(StoreAssistantState).show();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('[role="dialog"]')).not.toBeNull();
    expect(fixture.nativeElement.querySelector('.assistant-header img')).toBeNull();
    expect(fixture.nativeElement.querySelector('.assistant-close')).not.toBeNull();
    expect(fixture.nativeElement.querySelector('.assistant-message--welcome')).not.toBeNull();
    expect(fixture.nativeElement.textContent).toContain('Tourino');
  });

  it('loads the assistant before typing the welcome and each shortcut in order', () => {
    const host = fixture.nativeElement as HTMLElement;
    TestBed.inject(StoreAssistantState).show();
    fixture.detectChanges();

    expect(component.isStarting()).toBe(true);
    expect(host.querySelector('.assistant-startup')?.textContent).toContain('Iniciando o Tourino');
    expect(host.querySelector('.assistant-header img')).toBeNull();
    expect(host.querySelector('.assistant-composer')?.hasAttribute('inert')).toBe(true);

    vi.advanceTimersByTime(4999);
    fixture.detectChanges();
    expect(component.isStarting()).toBe(true);
    expect(host.querySelector('.assistant-header img')).toBeNull();

    vi.advanceTimersByTime(1);
    fixture.detectChanges();
    expect(component.isStarting()).toBe(false);
    expect(component.isIntroducing()).toBe(true);
    expect(host.querySelector('.assistant-startup')).toBeNull();
    expect(host.querySelector('.assistant-header img')?.getAttribute('src')).toBe(
      'assets/images/assistant/tourino-header.png',
    );

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

  it('accepts new messages while revealing a reply without losing the previous answer', () => {
    component.draft = 'Ver cupons';
    component.send();
    component.draft = 'Ver ofertas de hoje';
    component.send();
    component.submitPrompt('Meu carrinho');
    component.applyCoupon('CAMPO15');
    expect(component.messages()).toHaveLength(7);
    expect(component.draft).toBe('');
    expect(component.messages()[2].showCoupons).toBe(true);
    expect(component.messages()[4].products?.length).toBeGreaterThan(0);
    expect(component.messages().filter(message => message.typing)).toHaveLength(1);
    expect(cart.coupon()).toBeNull();

    vi.advanceTimersByTime(4000);
    expect(component.messages().at(-1)?.showCart).toBe(true);
    expect(component.messages().some(message => message.typing)).toBe(false);
  });

  it('executes a search, comparison and quotation in order from one message', () => {
    component.submitPrompt('Buscar irrigação até 800; compare o primeiro com o segundo; quanto ficam 2 unidades do segundo no Pix?');
    vi.advanceTimersByTime(15000);
    const replies = component.messages().filter(message => message.role === 'assistant' && message.id > 0);
    expect(replies).toHaveLength(3);
    expect(replies[0].products?.length).toBeGreaterThan(1);
    expect(replies[1].comparison).toBe(true);
    expect(replies[2].text).toContain('2 unidades');
    expect(replies[2].products?.[0].id).toBe(replies[0].products?.[1].id);
    expect(cart.isEmpty()).toBe(true);
    expect(component.taskProgress()).toBeNull();
  });

  it('pauses a sequence for an ambiguous cart item and resumes after the choice', () => {
    component.submitPrompt('Adicionar 2 sementes; quanto fica o carrinho no Pix?');
    vi.advanceTimersByTime(4000);
    const options = component.messages().at(-1)?.products;
    expect(options!.length).toBeGreaterThan(1);
    expect(cart.isEmpty()).toBe(true);
    component.submitPrompt('O segundo');
    vi.advanceTimersByTime(10000);
    expect(cart.getCartItems()()[0].product.id).toBe(options![1].id);
    expect(cart.totalCartItens()).toBe(2);
    expect(component.messages().at(-1)?.text).toContain('Resumo dos 2 itens selecionados');
  });

  it('stops queued actions when the user stops or changes the request', () => {
    component.submitPrompt('Buscar roçadeira; adicionar 1 roçadeira');
    component.stopSequence();
    vi.advanceTimersByTime(10000);
    expect(cart.isEmpty()).toBe(true);
    component.submitPrompt('Buscar roçadeira; adicionar 1 roçadeira');
    component.submitPrompt('Ver cupons');
    vi.advanceTimersByTime(10000);
    expect(cart.isEmpty()).toBe(true);
    expect(component.messages().at(-1)?.showCoupons).toBe(true);
  });

  it('applies the best available coupon only when asked and can undo it', () => {
    component.submitPrompt('Adicionar 1 roçadeira; aplique o melhor cupom');
    vi.advanceTimersByTime(10000);
    const best = Math.max(...component.coupons.map(coupon => coupon.discountPercentage));
    expect(cart.coupon()?.discountPercentage).toBe(best);
    component.submitPrompt('Desfazer');
    vi.advanceTimersByTime(4000);
    expect(cart.coupon()).toBeNull();
    expect(cart.totalCartItens()).toBe(1);
  });

  it('does not carry queued changes into another account', () => {
    component.submitPrompt('Buscar roçadeira; adicionar 1 roçadeira');
    component.finishResponse();
    TestBed.inject(Auth).currentUserId.set('outra-conta');
    vi.advanceTimersByTime(10000);
    expect(cart.isEmpty()).toBe(true);
    expect(component.taskProgress()).toBeNull();
    expect(component.messages()).toHaveLength(1);
  });

  it('asks to shorten requests over three steps without executing any of them', () => {
    component.submitPrompt('Adicionar 1 roçadeira; aplicar cupom CAMPO15; meu carrinho; ver cupons');
    vi.advanceTimersByTime(15000);
    expect(cart.isEmpty()).toBe(true);
    expect(cart.coupon()).toBeNull();
    expect(component.messages().at(-1)?.text).toContain('até 3 pedidos');
  });

  it('reveals the full message immediately when requested', () => {
    component.submitPrompt('Ver cupons');
    component.finishResponse();
    expect(component.isTyping()).toBe(false);
    expect(component.messages().at(-1)?.showCoupons).toBe(true);
    vi.advanceTimersByTime(4000);
    expect(component.messages()).toHaveLength(3);
  });

  it('adds a reviewed selection once and restores all quantities when undone', () => {
    component.submitPrompt('Buscar irrigação');
    vi.advanceTimersByTime(4000);
    const products = component.messages().at(-1)!.products!.slice(0, 3);
    cart.addCartItem(products[0], 2);
    const plan = {
      id: 999, role: 'assistant' as const, text: 'Seleção', products,
      shoppingPlan: { productIds: products.map(product => product.id), total: Math.round(products.reduce((sum, product) => sum + product.price, 0) * 100) / 100 },
    };
    component.messages.update(messages => [...messages, plan]);
    component.addShoppingPlan(plan);
    vi.advanceTimersByTime(4000);
    expect(cart.totalCartItens()).toBe(5);
    component.addShoppingPlan(plan);
    expect(cart.totalCartItens()).toBe(5);
    component.submitPrompt('Desfazer');
    vi.advanceTimersByTime(4000);
    expect(cart.getCartItems()()).toHaveLength(1);
    expect(cart.getCartItems()()[0].quantity).toBe(2);
    expect(component.messages().find(message => message.id === 999)?.shoppingPlan?.applied).toBe(false);
  });

  it('validates the whole selection before changing the cart', () => {
    component.submitPrompt('Buscar irrigação');
    vi.advanceTimersByTime(4000);
    const products = component.messages().at(-1)!.products!.slice(0, 2);
    const plan = {
      id: 999, role: 'assistant' as const, text: 'Seleção', products,
      shoppingPlan: { productIds: products.map(product => product.id), total: Math.round(products.reduce((sum, product) => sum + product.price, 0) * 100) / 100 },
    };
    component.messages.update(messages => [...messages, plan]);
    cart.addCartItem(products[1], 99);
    component.addShoppingPlan(plan);
    vi.advanceTimersByTime(4000);
    expect(cart.totalCartItens()).toBe(99);
    expect(cart.getCartItems()()).toHaveLength(1);
    cart.removeCartItem(products[1]);
    component.messages.update(messages => messages.map(message => message.id === 999 ? { ...plan, shoppingPlan: { ...plan.shoppingPlan, total: 1 } } : message));
    component.addShoppingPlan(plan);
    vi.advanceTimersByTime(4000);
    expect(cart.isEmpty()).toBe(true);
    expect(component.messages().at(-1)?.text).toContain('preços');
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

  describe('conversas com contexto', () => {
    beforeEach(() => {
      component.open.set(true);
      fixture.detectChanges();
      vi.advanceTimersByTime(5000);
      fixture.detectChanges();
    });

    function ask(message: string) {
      component.submitPrompt(message);
      vi.advanceTimersByTime(4000);
      fixture.detectChanges();
      return component.messages().at(-1)!;
    }

    it('pesquisa por orçamento e mantém a categoria ao refinar o preço', () => {
      const initial = ask('Quero irrigação até R$ 800');
      expect(cart.isEmpty()).toBe(true);
      expect(initial.products?.length).toBeGreaterThan(0);
      const narrowed = ask('E até R$ 300?');
      expect(narrowed.products?.length).toBeGreaterThan(0);
      expect(narrowed.products!.every((product) => product.category === 'Irrigação' && product.price <= 300)).toBe(true);
      const sorted = ask('Mostre opções mais baratas');
      expect(sorted.products!.map((product) => product.price)).toEqual([...sorted.products!].sort((a, b) => a.price - b.price).map((product) => product.price));
      expect(sorted.products!.every((product) => product.price <= 300)).toBe(true);
    });

    it('compara as opções citadas, calcula o Pix e adiciona a escolha correta', () => {
      const found = ask('Buscar irrigação');
      const second = found.products![1];
      const comparison = ask('Compare o primeiro com o segundo');
      expect(comparison.comparison).toBe(true);
      expect(comparison.products?.map((product) => product.id)).toEqual(found.products!.slice(0, 2).map((product) => product.id));
      expect(fixture.nativeElement.querySelectorAll('.assistant-comparison-values')).toHaveLength(2);
      const payment = ask('Quanto fica o segundo no Pix?');
      expect(payment.text).toContain(component.price(calculatePixPrice(second.price)));
      expect(payment.products?.[0].id).toBe(second.id);
      expect(payment.optionNumbers).toEqual([2]);
      ask('Adicionar 1 do segundo');
      expect(cart.getCartItems()()[0].product.id).toBe(second.id);
      expect(cart.getCartItems()()[0].quantity).toBe(1);
      ask('Quero 2 desse');
      expect(cart.getCartItems()()).toHaveLength(1);
      expect(cart.getCartItems()()[0].product.id).toBe(second.id);
      expect(cart.getCartItems()()[0].quantity).toBe(3);
      ask('Mais 2');
      expect(cart.getCartItems()()[0].quantity).toBe(5);
    });

    it('pede a escolha quando a ação pode corresponder a vários produtos', () => {
      const reply = ask('Adicionar 2 sementes ao carrinho');
      expect(reply.products!.length).toBeGreaterThan(1);
      expect(cart.isEmpty()).toBe(true);
      const selected = reply.products![1];
      ask('O segundo');
      expect(cart.getCartItems()()[0].product.id).toBe(selected.id);
      expect(cart.getCartItems()()[0].quantity).toBe(2);
      ask('O primeiro');
      expect(cart.totalCartItens()).toBe(2);
    });

    it('cancela uma ação pendente sem alterar o carrinho ao selecionar depois', () => {
      ask('Adicionar 2 sementes');
      ask('Cancelar');
      ask('O segundo');
      expect(cart.isEmpty()).toBe(true);
    });

    it('lembra a lista original depois de explicar uma das opções', () => {
      const initial = ask('Buscar irrigação');
      ask('Fale sobre o segundo');
      const third = ask('Fale sobre o terceiro');
      expect(third.products?.[0].id).toBe(initial.products![2].id);
      expect(third.optionNumbers).toEqual([3]);
    });

    it('não substitui um número de opção inexistente pelo produto em foco', () => {
      ask('Buscar roçadeira');
      ask('Fale sobre o primeiro');
      ask('Adicionar 1 da opção 4');
      expect(cart.isEmpty()).toBe(true);
    });

    it('usa o produto aberto na página quando não há uma busca anterior', () => {
      vi.spyOn(TestBed.inject(Router), 'url', 'get').mockReturnValue('/products/1dsoifjasdf-1234-5678-90ab-cdefghijklmn');
      const reply = ask('Quanto fica no Pix?');
      expect(reply.products?.[0].title).toContain('Estação Meteorológica');
      expect(reply.text).toContain('10x');
    });

    it('não inventa resultados nem ignora um orçamento impossível', () => {
      const reply = ask('Quero irrigação até R$ 1');
      expect(reply.products).toBeUndefined();
      expect(reply.text).toContain('Não encontrei');
      expect(reply.replyOptions?.length).toBeGreaterThan(0);
      expect(cart.isEmpty()).toBe(true);
      const invalid = ask('Buscar ferramentas entre R$ 500 e R$ 100');
      expect(invalid.text).toContain('mínimo ficou maior');
    });

    it.each(['Adicionar 100 roçadeiras', 'Adicionar -2 roçadeiras', 'Adicionar 0 roçadeiras'])('rejeita a quantidade inválida em “%s”', (message) => {
      const reply = ask(message);
      expect(reply.text).toContain('1 e 99');
      expect(cart.isEmpty()).toBe(true);
    });

    it('oferece próximos passos que continuam a conversa', () => {
      const result = ask('Buscar roçadeiras');
      expect(result.replyOptions?.length).toBeGreaterThan(0);
      expect(fixture.nativeElement.querySelector('.assistant-reply-options')).not.toBeNull();
      const details = result.replyOptions!.find((option) => option.label === 'Detalhes do primeiro')!;
      const reply = ask(details.prompt);
      expect(reply.products?.[0].id).toBe(result.products?.[0].id);
      expect(reply.text).toContain('Preço:');
    });

    it('refina exclusões, marca e nota sem perder o orçamento ou mudar o carrinho', () => {
      ask('Buscar insumos até R$ 800');
      const excluded = ask('Não quero sementes');
      expect(excluded.products!.length).toBeGreaterThan(0);
      expect(excluded.products!.every((product) => product.category === 'Insumos' && !/sementes/i.test(product.title) && product.price <= 800)).toBe(true);
      ask('Só MultiGrão');
      const rated = ask('Com nota mínima 4,5');
      expect(rated.products, rated.text).toBeDefined();
      expect(rated.products!.length).toBeGreaterThan(0);
      expect(rated.products!.every((product) => product.brand === 'MultiGrão' && product.rating >= 4.5 && product.price <= 800 && !/sementes/i.test(product.title))).toBe(true);
      expect(cart.isEmpty()).toBe(true);
    });

    it('mostra outras opções sem repetir e aplica a seleção à lista mais recente', () => {
      const initial = ask('Buscar irrigação até R$ 5000');
      const firstIds = initial.products!.map((product) => product.id);
      const next = ask('Outras opções');
      expect(next.products!.length).toBeGreaterThan(0);
      expect(next.products!.every((product) => !firstIds.includes(product.id) && product.category === 'Irrigação' && product.price <= 5000)).toBe(true);
      ask('Adicionar 1 do primeiro');
      expect(cart.getCartItems()()[0].product.id).toBe(next.products![0].id);
    });

    it('limpa o limite pela sugestão após uma busca sem resultados e reinicia o assunto', () => {
      const empty = ask('Buscar irrigação até R$ 1');
      const broadened = ask(empty.replyOptions!.find((option) => option.label === 'Sem limite de preço')!.prompt);
      expect(broadened.products!.length).toBeGreaterThan(0);
      expect(broadened.products!.every((product) => product.category === 'Irrigação')).toBe(true);
      ask('Recomeçar busca');
      const reset = ask('Buscar ferramentas');
      expect(reset.products!.every((product) => product.category === 'Ferramentas')).toBe(true);
    });

    it('refina o preço em relação ao produto em foco, e não ao mais barato da lista', () => {
      const initial = ask('Buscar irrigação');
      const mostExpensive = [...initial.products!].sort((a, b) => b.price - a.price)[0];
      ask(`Fale sobre a opção ${initial.products!.indexOf(mostExpensive) + 1}`);
      const cheaper = ask('Mais barato que esse');
      expect(cheaper.products!.length).toBeGreaterThan(0);
      expect(cheaper.products!.every((product) => product.price < mostExpensive.price && product.category === 'Irrigação')).toBe(true);
      expect(cheaper.text).toContain(component.price(Math.round((mostExpensive.price - 0.01) * 100) / 100));
    });

    it('explica critérios e continua uma pergunta de pagamento após escolher a opção', () => {
      const initial = ask('Recomende irrigação até R$ 800');
      const reason = ask('Por que o segundo?');
      expect(reason.products![0].id).toBe(initial.products![1].id);
      expect(reason.text).toContain(initial.products![1].description);
      expect(reason.text).toContain('atende à sua busca');
      ask('Buscar irrigação');
      const question = ask('Quanto fica no Pix?');
      expect(question.text).toContain('De qual produto');
      const selected = question.products![1];
      const payment = ask('O segundo');
      expect(payment.text).toContain(component.price(calculatePixPrice(selected.price)));
      expect(payment.text).toContain('10x');
      expect(cart.isEmpty()).toBe(true);
    });

    it('confirma características com evidência e admite quando a informação não existe', () => {
      ask('Buscar bomba submersa solar');
      const solar = ask('É solar?');
      expect(solar.text).toContain('Alimentação solar: o catálogo informa');
      expect(solar.text).toContain('750 W');
      const bluetooth = ask('Tem bluetooth?');
      expect(bluetooth.text).toContain('Bluetooth: não está informada');
      expect(bluetooth.products![0].id).toBe(solar.products![0].id);
    });

    it('aceita o nome do produto para concluir uma ação ambígua', () => {
      const pending = ask('Adicionar 2 sementes');
      const selected = pending.products![1];
      ask(selected.title);
      expect(cart.getCartItems()()).toHaveLength(1);
      expect(cart.getCartItems()()[0].product.id).toBe(selected.id);
      expect(cart.getCartItems()()[0].quantity).toBe(2);
    });

    it('desfaz inclusão, alteração e remoção preservando quantidades anteriores', () => {
      ask('Adicionar 2 roçadeiras');
      ask('Desfazer');
      expect(cart.isEmpty()).toBe(true);
      ask('Adicionar 2 roçadeiras');
      ask('Mais 2');
      expect(cart.totalCartItens()).toBe(4);
      ask('Desfazer');
      expect(cart.totalCartItens()).toBe(2);
      const product = cart.getCartItems()()[0].product;
      cart.setProductSelected(product.id, false);
      ask('Remover roçadeira');
      ask('Desfazer');
      expect(cart.totalCartItens()).toBe(2);
      expect(cart.isProductSelected(product.id)).toBe(false);
      expect(ask('Desfazer').text).toContain('não há uma alteração');
    });

    it('desfaz cupom e preserva o cupom atual em tentativa inválida', () => {
      ask('Aplicar cupom CAMPO15');
      component.applyCoupon('INEXISTENTE');
      vi.advanceTimersByTime(4000);
      expect(cart.coupon()?.code).toBe('CAMPO15');
      ask('Desfazer');
      expect(cart.coupon()).toBeNull();
    });

    it('não sobrescreve mudanças externas ao desfazer', () => {
      ask('Adicionar 2 roçadeiras');
      const product = cart.getCartItems()()[0].product;
      cart.setItemQuantity(product.id, 5);
      const reply = ask('Desfazer');
      expect(reply.text).toContain('carrinho mudou');
      expect(cart.totalCartItens()).toBe(5);
    });

    it('não aplica o desfazer de uma conta em outra conta', () => {
      ask('Adicionar 2 roçadeiras');
      TestBed.inject(Auth).currentUserId.set('outro-usuario');
      const reply = ask('Desfazer');
      expect(reply.text).toContain('Ainda não há');
      expect(component.messages().some(message => message.text.includes('unidades adicionadas'))).toBe(false);
    });

    it('compara todas as quatro opções e mantém a numeração após comparar um subconjunto', () => {
      const initial = ask('Buscar irrigação');
      expect(ask('Compare todos').products).toHaveLength(4);
      const comparison = ask('Compare o segundo com o quarto');
      expect(comparison.products!.map((product) => product.id)).toEqual([initial.products![1].id, initial.products![3].id]);
      expect(comparison.optionNumbers).toEqual([2, 4]);
      expect(ask('Fale sobre o terceiro').products![0].id).toBe(initial.products![2].id);
    });

    it('simula várias unidades e parcelas sem adicionar produtos', () => {
      const options = ask('Buscar irrigação').products!;
      const reply = ask('Quanto ficam 3 unidades do segundo em 3 parcelas?');
      expect(reply.text).toContain('3 unidades');
      expect(reply.text).toContain(component.price(options[1].price * 3));
      expect(reply.text).toContain(`Em 3x: aproximadamente ${component.price(options[1].price)}`);
      expect(reply.products?.[0].id).toBe(options[1].id);
      expect(cart.isEmpty()).toBe(true);
      expect(reply.replyOptions?.[0].prompt).toBe('Adicionar 3 desse');
    });

    it('preserva a quantidade ao pedir esclarecimento e valida limites', () => {
      const options = ask('Buscar irrigação').products!;
      expect(ask('Quanto ficam 2 unidades?').text).toContain('De qual produto');
      expect(ask('O terceiro').text).toContain(component.price(options[2].price * 2));
      for (const quantity of ['0', '-2', '100', '1,5']) {
        expect(ask(`Quanto ficam ${quantity} unidades desse?`).text).toContain('entre 1 e 99');
      }
      expect(ask('Quanto fica esse em 24 parcelas?').text).toContain('1 a 10 parcelas');
      expect(cart.isEmpty()).toBe(true);
    });

    it('calcula apenas os itens selecionados e sugere cupom sem aplicar sozinho', () => {
      ask('Adicionar 2 roçadeiras');
      ask('Adicionar 1 sementes de milho');
      const first = cart.getCartItems()()[0];
      cart.setProductSelected(first.product.id, false);
      const expected = cart.selectedTotal();
      const reply = ask('Meu carrinho cabe no orçamento de 500 reais?');
      expect(reply.text).toContain(`Total: ${component.price(expected)}`);
      expect(reply.text).toContain(`sobram ${component.price(500 - expected)}`);
      expect(reply.text).toContain('economizaria mais');
      expect(cart.coupon()).toBeNull();
      expect(ask(reply.replyOptions![0].prompt).text).toContain('aplicado');
      expect(cart.coupon()).not.toBeNull();
      expect(ask('Qual o melhor cupom?').text).toContain('já é tão bom');
    });

    it('informa quando nenhum item está selecionado para compra', () => {
      ask('Adicionar 1 roçadeira');
      cart.setProductSelected(cart.getCartItems()()[0].product.id, false);
      expect(ask('Quanto fica meu carrinho no Pix?').text).toContain('nenhum está selecionado');
    });

    it('retoma a conversa e as referências após recriar a página, inclusive durante a digitação', () => {
      const products = ask('Buscar irrigação até 800 reais').products!;
      component.submitPrompt('Fale sobre o segundo');
      expect(component.isTyping()).toBe(true);
      fixture.destroy();
      fixture = TestBed.createComponent(StoreAssistant);
      component = fixture.componentInstance;
      fixture.detectChanges();
      expect(component.isTyping()).toBe(false);
      expect(component.messages().at(-1)?.text).toContain(products[1].title);
      expect(component.messages().at(-1)?.typing).not.toBe(true);
      const reply = ask('Quanto ficam 2 desses no Pix?');
      expect(reply.text).toContain(component.price(products[1].price * 2));
      expect(cart.isEmpty()).toBe(true);
      component.resetConversation();
      expect(component.messages()).toHaveLength(1);
      expect(ask('O segundo').products).toBeUndefined();
    });

    it('consulta somente os pedidos da conta atual e não inventa rastreio', () => {
      expect(ask('Onde está meu pedido?').link?.path).toBe('/login');
      const auth = TestBed.inject(Auth);
      auth.currentUserId.set('order-owner');
      fixture.detectChanges();
      const orders = TestBed.inject(OrderService);
      const readOrders = vi.spyOn(orders, 'getOrdersByUserId').mockReturnValue([{
        id: 'order-123', userId: 'order-owner', customerName: 'Cliente', items: [], subtotal: 50,
        total: 50, shipping: 0, discount: 0, status: OrderStatus.Confirmed,
        paymentMethod: OrderPaymentMethod.Pix, createdAt: '2026-11-04T12:00:00Z',
        address: {} as never,
      }]);
      const reply = ask('Status do pedido order-123');
      expect(readOrders).toHaveBeenCalledWith('order-owner');
      expect(reply.text).toContain('Status: Confirmado');
      expect(reply.link?.path).toBe('/orders/order-123');
      expect(ask('Status do pedido order-456').text).toContain('Não encontrei esse pedido');
      auth.currentUserId.set(null);
      fixture.detectChanges();
      expect(component.messages()).toHaveLength(1);
      expect(ask('Onde está meu pedido?').link?.path).toBe('/login');
    });
  });
});
