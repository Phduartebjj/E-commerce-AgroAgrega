import { Component, ElementRef, HostListener, ViewChild, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

import { COUPONS } from '../../../core/data/coupons';
import { Cart } from '../../../core/services/cart/cart.service';
import { ProductService } from '../../../core/services/product/product.service';
import { ProductModel } from '../../../models/product';
import {
  findAssistantProducts,
  interpretAssistantMessage,
  normalizeAssistantText,
} from './assistant-intent';

type ProductAction = 'add' | 'remove' | 'increase' | 'decrease' | 'setQuantity';

interface ChatMessage {
  id: number;
  role: 'assistant' | 'user';
  text: string;
  products?: ProductModel[];
  productAction?: ProductAction;
  quantity?: number;
  showCart?: boolean;
  showCoupons?: boolean;
  link?: { label: string; path: string; queryParams?: Record<string, string> };
}

@Component({
  selector: 'app-store-assistant',
  imports: [FormsModule, RouterLink],
  templateUrl: './store-assistant.html',
  styleUrl: './store-assistant.css',
})
export class StoreAssistant {
  private readonly productService = inject(ProductService);
  private readonly cart = inject(Cart);
  private readonly router = inject(Router);
  private readonly products = this.productService.getProducts();
  private nextMessageId = 1;

  @ViewChild('composer') private composer?: ElementRef<HTMLInputElement>;
  @ViewChild('messageList') private messageList?: ElementRef<HTMLElement>;

  readonly open = signal(false);
  readonly messages = signal<ChatMessage[]>([{
    id: 0,
    role: 'assistant',
    text: 'Olá! Sou o assistente AgroAgrega. Posso encontrar produtos, ofertas e cupons, além de organizar seu carrinho. Como posso ajudar?',
  }]);
  readonly cartItems = this.cart.getCartItems();
  readonly cartCount = this.cart.totalCartItens;
  readonly cartTotal = this.cart.total;
  readonly currentCoupon = this.cart.coupon;
  readonly coupons = COUPONS;
  readonly suggestions = [
    'Ver ofertas de hoje',
    'Quantos itens no carrinho?',
    'Buscar sementes de milho',
    'Ver cupons',
  ];

  draft = '';

  toggle(): void {
    this.open.update((value) => !value);
    if (this.open()) setTimeout(() => this.composer?.nativeElement.focus());
  }

  close(): void {
    this.open.set(false);
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    this.close();
  }

  send(): void {
    const message = this.draft.trim().slice(0, 240);
    if (!message) return;
    this.draft = '';
    this.submitPrompt(message);
  }

  submitPrompt(message: string): void {
    this.append({ role: 'user', text: message });
    this.respond(message);
  }

  addFromResult(product: ProductModel, action: ProductAction = 'add', quantity = 1): void {
    this.actOnProduct(product, action, quantity);
  }

  changeCartQuantity(product: ProductModel, change: number): void {
    const item = this.cartItems().find((entry) => entry.product.id === product.id);
    if (!item) return;
    this.cart.setItemQuantity(product.id, item.quantity + change);
  }

  removeFromCart(product: ProductModel): void {
    this.cart.removeCartItem(product);
  }

  applyCoupon(code: string): void {
    this.cart.applyCoupon(code);
    this.append({ role: 'assistant', text: `Cupom ${code} aplicado ao carrinho. O desconto aparece no resumo da compra.`, link: { label: 'Ver carrinho', path: '/cart' } });
  }

  price(value: number): string {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  }

  private respond(message: string): void {
    const intent = interpretAssistantMessage(message);
    const products = this.products();

    switch (intent.type) {
      case 'help':
        this.append({ role: 'assistant', text: 'Você pode pedir: “buscar roçadeira”, “ver ofertas”, “adicionar 2 sementes de milho”, “quantos itens no carrinho?”, “ajustar a quantidade de roçadeira para 3” ou “aplicar cupom CAMPO15”. Também posso abrir seu carrinho, pedidos e conta. Não finalizo pedidos nem pagamentos por você.' });
        return;
      case 'counts':
        this.append({ role: 'assistant', text: `O catálogo tem ${products.length} produtos e seu carrinho tem ${this.cartCount()} ${this.cartCount() === 1 ? 'item' : 'itens'}. Não tenho acesso a estoque em tempo real.`, link: { label: 'Ver catálogo', path: '/products' } });
        return;
      case 'stock':
        this.append({ role: 'assistant', text: 'O catálogo ainda não informa estoque em tempo real. Posso mostrar o produto e ajudar a colocá-lo no carrinho, mas não vou inventar uma quantidade disponível.', link: { label: 'Ver catálogo', path: '/products' } });
        return;
      case 'cart':
        this.append({ role: 'assistant', text: this.cartCount() ? 'Este é seu carrinho agora. Você pode ajustar as quantidades aqui ou me dizer o que mudar.' : 'Seu carrinho está vazio. Posso buscar algo para você adicionar.', showCart: true, link: { label: 'Abrir carrinho', path: '/cart' } });
        return;
      case 'offers': {
        const offers = products.filter((product) => product.flashOffer).sort((a, b) => (b.flashOfferDiscount ?? 0) - (a.flashOfferDiscount ?? 0)).slice(0, 4);
        this.append({ role: 'assistant', text: offers.length ? 'Estas são algumas ofertas-relâmpago de hoje. Elas podem mudar amanhã.' : 'Não há ofertas-relâmpago disponíveis agora.', products: offers, link: { label: 'Ver todas as ofertas', path: '/products', queryParams: { offers: 'true' } } });
        return;
      }
      case 'popular': {
        const popular = [...products].sort((a, b) => (b.weeklySales ?? 0) - (a.weeklySales ?? 0)).slice(0, 4);
        this.append({ role: 'assistant', text: 'Estes estão entre os produtos mais procurados do catálogo:', products: popular, link: { label: 'Explorar catálogo', path: '/products' } });
        return;
      }
      case 'coupons':
        this.append({ role: 'assistant', text: 'Confira os cupons disponíveis. Escolha um para aplicar ao carrinho:', showCoupons: true, link: { label: 'Detalhes dos cupons', path: '/coupons' } });
        return;
      case 'applyCoupon': {
        const coupon = COUPONS.find((item) => item.code === intent.code);
        if (coupon) this.applyCoupon(coupon.code);
        else this.append({ role: 'assistant', text: `Não encontrei o cupom ${intent.code}. Posso mostrar os cupons disponíveis.`, showCoupons: true });
        return;
      }
      case 'navigate':
        void this.router.navigateByUrl(intent.path);
        this.append({ role: 'assistant', text: `Abrindo ${intent.label.toLocaleLowerCase('pt-BR')}.` });
        return;
      case 'search':
      case 'details': {
        const matches = findAssistantProducts(products, intent.query);
        if (!matches.length) {
          this.append({ role: 'assistant', text: 'Não encontrei um produto correspondente. Tente usar o nome, a categoria ou uma palavra mais específica.', link: { label: 'Explorar catálogo', path: '/products' } });
          return;
        }
        const text = intent.type === 'details' && matches.length === 1
          ? `${matches[0].title} custa ${this.price(matches[0].price)}. ${matches[0].description}`
          : `Encontrei ${matches.length} ${matches.length === 1 ? 'opção' : 'opções'} para “${intent.query}”.`;
        this.append({ role: 'assistant', text, products: matches, link: { label: 'Ver busca no catálogo', path: '/products', queryParams: { search: intent.query } } });
        return;
      }
      default:
        this.handleProductAction(intent.type, intent.query, intent.quantity);
    }
  }

  private handleProductAction(action: ProductAction, query: string, quantity: number): void {
    if (!query || quantity < 0 || quantity > 99 || (action !== 'remove' && quantity === 0)) {
      this.append({ role: 'assistant', text: 'Diga o nome do produto e uma quantidade entre 1 e 99. Exemplo: “adicionar 2 sementes de milho”.' });
      return;
    }

    const source = action === 'add' ? this.products() : this.cartItems().map((item) => item.product);
    const matches = findAssistantProducts(source, query);
    if (!matches.length) {
      this.append({ role: 'assistant', text: action === 'add' ? 'Não encontrei esse produto no catálogo. Tente um nome mais curto.' : 'Não encontrei esse produto no seu carrinho.', link: action === 'add' ? { label: 'Explorar catálogo', path: '/products' } : { label: 'Ver carrinho', path: '/cart' } });
      return;
    }

    const normalizedQuery = normalizeAssistantText(query);
    const exact = matches.filter((product) => normalizeAssistantText(product.title) === normalizedQuery);
    const containing = matches.filter((product) => normalizeAssistantText(product.title).includes(normalizedQuery));
    const selected = exact.length === 1 ? exact[0] : containing.length === 1 ? containing[0] : matches.length === 1 ? matches[0] : null;

    if (selected) {
      this.actOnProduct(selected, action, quantity);
    } else {
      this.append({ role: 'assistant', text: 'Encontrei mais de um produto. Escolha o item certo antes de alterar o carrinho:', products: matches, productAction: action, quantity });
    }
  }

  private actOnProduct(product: ProductModel, action: ProductAction, quantity: number): void {
    const item = this.cartItems().find((entry) => entry.product.id === product.id);

    if (action === 'add') {
      if ((item?.quantity ?? 0) + quantity > 99) {
        this.append({ role: 'assistant', text: 'O limite é de 99 unidades por produto no carrinho.' });
        return;
      }
      this.cart.addCartItem(product, quantity);
      this.append({ role: 'assistant', text: `${quantity} ${quantity === 1 ? 'unidade adicionada' : 'unidades adicionadas'}: ${product.title}. Agora seu carrinho tem ${this.cartCount()} ${this.cartCount() === 1 ? 'item' : 'itens'}.`, link: { label: 'Ver carrinho', path: '/cart' } });
      return;
    }

    if (!item) {
      this.append({ role: 'assistant', text: 'Esse produto não está mais no carrinho.' });
      return;
    }

    if (action === 'remove') {
      this.cart.removeCartItem(item.product);
      this.append({ role: 'assistant', text: `${product.title} foi removido do carrinho.`, link: { label: 'Ver carrinho', path: '/cart' } });
      return;
    }

    const nextQuantity = action === 'setQuantity' ? quantity : item.quantity + (action === 'increase' ? quantity : -quantity);
    if (!this.cart.setItemQuantity(product.id, nextQuantity)) {
      this.append({ role: 'assistant', text: 'A quantidade deve ficar entre 1 e 99. Para retirar o produto, peça “remover” seguido do nome.' });
      return;
    }
    this.append({ role: 'assistant', text: `Quantidade de ${product.title} atualizada para ${nextQuantity}.`, link: { label: 'Ver carrinho', path: '/cart' } });
  }

  private append(message: Omit<ChatMessage, 'id'>): void {
    this.messages.update((current) => [...current.slice(-39), { ...message, id: this.nextMessageId++ }]);
    setTimeout(() => {
      const list = this.messageList?.nativeElement;
      if (list) list.scrollTop = list.scrollHeight;
    });
  }
}
