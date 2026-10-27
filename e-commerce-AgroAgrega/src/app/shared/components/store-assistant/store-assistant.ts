import { DOCUMENT, isPlatformBrowser } from '@angular/common';
import {
  Component,
  DestroyRef,
  ElementRef,
  HostListener,
  PLATFORM_ID,
  ViewChild,
  effect,
  inject,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

import { CouponService } from '../../../core/services/coupon/coupon.service';
import { Auth } from '../../../core/services/auth/auth.service';
import { Cart } from '../../../core/services/cart/cart.service';
import { ProductService } from '../../../core/services/product/product.service';
import { ProductModel } from '../../../models/product';
import { calculateInstallmentPrice, calculatePixPrice } from '../../utils/product-card-display';
import { StoreAssistantState } from './store-assistant-state';
import {
  findAssistantProducts,
  interpretAssistantMessage,
  normalizeAssistantText,
} from './assistant-intent';
import {
  AssistantCatalogRequest,
  hasAssistantReference,
  mergeAssistantCatalogRequest,
  parseAssistantCatalogRequest,
  resolveAssistantReferences,
  searchAssistantCatalog,
} from './assistant-catalog';
import { answerAssistantFeatureQuestion, isAssistantFeatureQuestion } from './assistant-product-advice';

type ProductAction = 'add' | 'remove' | 'increase' | 'decrease' | 'setQuantity';
type ProductQuestion = 'payment' | 'shipping' | 'details' | 'explain';
type CartUndo = ({ type: 'item'; product: ProductModel; quantity: number; selected: boolean }
  | { type: 'coupon'; code?: string }) & { expectedState: string };

interface ChatMessage {
  id: number;
  role: 'assistant' | 'user';
  text: string;
  typing?: boolean;
  products?: ProductModel[];
  productAction?: ProductAction;
  quantity?: number;
  showCart?: boolean;
  showCoupons?: boolean;
  comparison?: boolean;
  preserveResultContext?: boolean;
  optionNumbers?: number[];
  replyOptions?: { label: string; prompt: string }[];
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
  private readonly auth = inject(Auth);
  private readonly router = inject(Router);
  private readonly document = inject(DOCUMENT);
  private readonly browser = isPlatformBrowser(inject(PLATFORM_ID));
  private readonly destroyRef = inject(DestroyRef);
  private readonly products = this.productService.getProducts();
  private nextMessageId = 1;
  private typingTimer?: ReturnType<typeof setTimeout>;
  private scrollTimer?: ReturnType<typeof setTimeout>;
  private introTimer?: ReturnType<typeof setTimeout>;
  private focusTimer?: ReturnType<typeof setTimeout>;
  private lastResults: ProductModel[] = [];
  private lastFocusedProductId?: string;
  private lastCatalogRequest?: AssistantCatalogRequest;
  private pendingProductAction?: { action: ProductAction; quantity: number };
  private pendingQuestion?: { type: ProductQuestion; query: string };
  private shownProductIds = new Set<string>();
  private cartUndo?: CartUndo;

  @ViewChild('composer') private composer?: ElementRef<HTMLInputElement>;
  @ViewChild('messageList') private messageList?: ElementRef<HTMLElement>;

  readonly open = inject(StoreAssistantState).open;
  readonly isStarting = signal(false);
  readonly isIntroducing = signal(false);
  readonly introPart = signal(0);
  readonly introGreeting = signal('');
  readonly introDescription = signal('');
  readonly introShortcutIndex = signal(-1);
  readonly introShortcutText = signal('');
  readonly isTyping = signal(false);
  readonly messages = signal<ChatMessage[]>([
    {
      id: 0,
      role: 'assistant',
      text: 'Olá! Sou o assistente AgroAgrega. Posso encontrar produtos, ofertas e cupons, além de organizar seu carrinho. Como posso ajudar?',
    },
  ]);
  readonly cartItems = this.cart.getCartItems();
  readonly cartCount = this.cart.totalCartItens;
  readonly cartTotal = this.cart.total;
  readonly currentCoupon = this.cart.coupon;
  private readonly couponCatalog = inject(CouponService);
  get coupons() {
    return this.couponCatalog.coupons();
  }
  readonly assistantTime = signal('');
  readonly suggestions = [
    {
      label: 'Buscar produtos',
      prompt: 'Buscar produtos',
      icon: 'search',
    },
    {
      label: 'Ver ofertas de hoje',
      prompt: 'Ver ofertas de hoje',
      icon: 'offer',
    },
    {
      label: 'Ver cupons',
      prompt: 'Ver cupons',
      icon: 'coupon',
    },
    {
      label: 'Meu carrinho',
      prompt: 'Quantos itens no carrinho?',
      icon: 'cart',
    },
    {
      label: 'Buscar sementes e fertilizantes',
      prompt: 'Buscar sementes e fertilizantes',
      icon: 'leaf',
    },
  ];

  draft = '';

  constructor() {
    effect((onCleanup) => {
      if (this.open()) {
        this.isStarting.set(true);
        this.assistantTime.set(
          new Intl.DateTimeFormat('pt-BR', {
            hour: '2-digit',
            minute: '2-digit',
          }).format(new Date()),
        );
        const reducedMotion = this.document.defaultView?.matchMedia?.(
          '(prefers-reduced-motion: reduce)',
        ).matches;
        const startupTimer = setTimeout(() => {
          this.isStarting.set(false);
          this.focusTimer = setTimeout(() => {
            if (this.open()) this.composer?.nativeElement.focus();
          }, 50);
          this.scrollToLatest();
          if (!reducedMotion && this.messages().length === 1) {
            this.startIntroduction();
          }
        }, 5000);
        onCleanup(() => {
          clearTimeout(startupTimer);
          clearTimeout(this.introTimer);
          clearTimeout(this.focusTimer);
        });
      } else {
        this.isStarting.set(false);
        this.isIntroducing.set(false);
      }
    });
    this.destroyRef.onDestroy(() => {
      clearTimeout(this.typingTimer);
      clearTimeout(this.scrollTimer);
      clearTimeout(this.introTimer);
      clearTimeout(this.focusTimer);
    });
  }

  toggle(): void {
    if (!this.open()) this.isStarting.set(true);
    this.open.update((value) => !value);
  }

  close(): void {
    this.open.set(false);
  }

  shortcutLabel(index: number, label: string): string {
    if (!this.isIntroducing() || index < this.introShortcutIndex()) return label;
    return index === this.introShortcutIndex() ? this.introShortcutText() : '';
  }

  private startIntroduction(): void {
    const greeting = 'Olá! Sou o Tourino, assistente da AgroAgrega! 🌿';
    const description =
      'Posso te ajudar a encontrar produtos, ver ofertas e cupons, além de organizar seu carrinho. Como posso ajudar você hoje?';
    const parts = [
      { text: greeting, update: (value: string) => this.introGreeting.set(value) },
      { text: description, update: (value: string) => this.introDescription.set(value) },
      ...this.suggestions.map((suggestion, index) => ({
        text: suggestion.label,
        update: (value: string) => {
          this.introShortcutIndex.set(index);
          this.introShortcutText.set(value);
        },
      })),
    ];

    this.introGreeting.set('');
    this.introDescription.set('');
    this.introShortcutIndex.set(-1);
    this.introShortcutText.set('');
    this.introPart.set(0);
    this.isIntroducing.set(true);

    let partIndex = 0;
    let characterIndex = 0;
    const typeNext = () => {
      if (!this.open()) return;
      const part = parts[partIndex];
      this.introPart.set(partIndex);
      characterIndex = Math.min(characterIndex + 2, part.text.length);
      part.update(part.text.slice(0, characterIndex));
      if (characterIndex < part.text.length) {
        this.introTimer = setTimeout(typeNext, 18);
      } else if (++partIndex < parts.length) {
        characterIndex = 0;
        this.introTimer = setTimeout(typeNext, 180);
      } else {
        this.introTimer = setTimeout(() => this.finishIntroduction(), 180);
      }
    };
    this.introTimer = setTimeout(typeNext, 180);
  }

  private finishIntroduction(): void {
    clearTimeout(this.introTimer);
    this.introTimer = undefined;
    this.isIntroducing.set(false);
    this.scrollToLatest();
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    this.close();
  }

  send(): void {
    const message = this.draft.trim().slice(0, 240);
    if (!message || this.isTyping()) return;
    this.draft = '';
    this.submitPrompt(message);
  }

  submitPrompt(message: string): void {
    message = message.trim().slice(0, 240);
    if (!message || this.isTyping()) return;
    if (this.isIntroducing()) this.finishIntroduction();
    this.append({ role: 'user', text: message });
    this.respond(message);
  }
  addFromResult(product: ProductModel, action: ProductAction = 'add', quantity = 1): void {
    if (this.isTyping()) return;
    this.actOnProduct(product, action, quantity);
  }

  changeCartQuantity(product: ProductModel, change: number): void {
    if (this.isTyping()) return;
    this.actOnProduct(product, change > 0 ? 'increase' : 'decrease', Math.abs(change));
  }

  removeFromCart(product: ProductModel): void {
    if (this.isTyping()) return;
    this.actOnProduct(product, 'remove', 0);
  }

  applyCoupon(code: string): void {
    if (this.isTyping()) return;
    const previous = this.currentCoupon()?.code;
    this.cart.applyCoupon(code);
    if (!this.cart.coupon()) {
      this.append({
        role: 'assistant',
        text: 'Este cupom venceu ou não está disponível. Confira os cupons de hoje:',
        showCoupons: true,
      });
      return;
    }
    if (previous !== this.currentCoupon()?.code) {
      this.cartUndo = { type: 'coupon', code: previous, expectedState: this.cartFingerprint() };
    }
    this.append({
      role: 'assistant',
      text: `Cupom ${code} aplicado ao carrinho. O desconto aparece no resumo da compra.`,
      replyOptions: [{ label: 'Desfazer', prompt: 'Desfazer última alteração' }],
      link: { label: 'Ver carrinho', path: '/cart' },
    });
  }

  price(value: number): string {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  }

  readonly pixPrice = calculatePixPrice;
  readonly installmentPrice = calculateInstallmentPrice;

  private respond(message: string): void {
    const intent = interpretAssistantMessage(message);
    const products = this.products();
    const followUp = intent.type === 'select' || (intent.type === 'search' &&
      !/^(?:buscar|busque|procure|pesquise|quero|agora|mostre)\b/.test(normalizeAssistantText(message)));
    if (followUp && (this.pendingProductAction || this.pendingQuestion)) {
      const references = resolveAssistantReferences(message, this.lastResults);
      const matches = references.length ? references : hasAssistantReference(message) ? []
        : findAssistantProducts(this.lastResults.length ? this.lastResults : products, message, 4);
      if (matches.length === 1) {
        const product = products.find((entry) => entry.id === matches[0].id) ?? matches[0];
        const action = this.pendingProductAction;
        const question = this.pendingQuestion;
        this.pendingProductAction = undefined;
        this.pendingQuestion = undefined;
        this.lastFocusedProductId = product.id;
        if (action) this.actOnProduct(product, action.action, action.quantity);
        else if (question) this.answerProductQuestion(question.type, product, question.query);
        return;
      }
      this.append({ role: 'assistant', text: 'Ainda preciso de uma opção específica. Diga o número ou o nome completo do produto; você também pode cancelar a escolha.' });
      return;
    }
    this.pendingProductAction = undefined;
    this.pendingQuestion = undefined;

    switch (intent.type) {
      case 'help':
        this.append({
          role: 'assistant',
          text: 'Sou o Tourino! Posso encontrar produtos pelo uso, marca e orçamento, explicar minhas sugestões e comparar opções. Experimente “irrigação até R$ 300”, depois “outras opções” ou “por que o segundo?”. Também organizo seu carrinho e posso desfazer minha última alteração. O que você precisa para o seu campo?',
          replyOptions: [
            { label: 'Escolher irrigação', prompt: 'Recomende produtos para irrigação' },
            { label: 'Até R$ 200', prompt: 'Buscar produtos até R$ 200' },
            { label: 'Ofertas de hoje', prompt: 'Ver ofertas de hoje' },
          ],
        });
        return;
      case 'thanks':
        this.append({ role: 'assistant', text: 'Por nada! Quando precisar, posso continuar a comparação, buscar outra opção ou ajudar com seu carrinho.' });
        return;
      case 'cancel':
        this.pendingProductAction = undefined;
        this.append({ role: 'assistant', text: 'Certo, cancelei a escolha pendente. Como posso ajudar agora?' });
        return;
      case 'undo':
        this.undoCartChange();
        return;
      case 'more':
        this.showMoreProducts();
        return;
      case 'reset':
        this.lastCatalogRequest = undefined;
        this.lastResults = [];
        this.lastFocusedProductId = undefined;
        this.shownProductIds.clear();
        this.append({ role: 'assistant', text: 'Vamos começar uma nova busca. Qual é o uso e o orçamento que você tem em mente?',
          replyOptions: ['Irrigação', 'Ferramentas', 'Insumos'].map((category) => ({ label: category, prompt: `Buscar ${category}` })) });
        return;
      case 'select': {
        const selected = this.contextProducts(intent.query);
        if (selected.length !== 1) {
          this.append({ role: 'assistant', text: 'Preciso saber qual produto você escolheu. Diga “o primeiro”, “o segundo” ou o nome do item que mostrei.' });
          return;
        }
        this.describeProduct(selected[0]);
        return;
      }
      case 'compare':
        this.compareProducts(intent.query);
        return;
      case 'payment':
        this.explainPayment(intent.query);
        return;
      case 'shipping':
      case 'explain':
        this.askAboutProduct(intent.type, intent.query);
        return;
      case 'policy':
        this.append({
          role: 'assistant',
          text: intent.topic === 'returns'
            ? 'A página do produto apresenta devolução grátis em até 30 dias, conforme as condições da compra. Para tratar de uma compra específica, abra seus pedidos e confira os dados do item.'
            : 'A garantia depende do fabricante e do produto. Posso abrir os detalhes para você conferir as informações disponíveis; quando o prazo não estiver informado, confirme com a loja parceira.',
          link: { label: intent.topic === 'returns' ? 'Ver meus pedidos' : 'Ver catálogo', path: intent.topic === 'returns' ? '/orders' : '/products' },
        });
        return;
      case 'counts':
        this.append({
          role: 'assistant',
          text: `O catálogo tem ${products.length} produtos e seu carrinho tem ${this.cartCount()} ${this.cartCount() === 1 ? 'item' : 'itens'}. Não tenho acesso a estoque em tempo real.`,
          link: { label: 'Ver catálogo', path: '/products' },
        });
        return;
      case 'stock':
        this.append({
          role: 'assistant',
          text: 'Não recebo o saldo de estoque em tempo real. Posso localizar o produto e abrir seus detalhes para você conferir as informações da loja. Qual item você procura?',
          link: { label: 'Ver catálogo', path: '/products' },
        });
        return;
      case 'cart':
        this.append({
          role: 'assistant',
          text: this.cartCount()
            ? 'Este é seu carrinho agora. Você pode ajustar as quantidades aqui ou me dizer o que mudar.'
            : 'Seu carrinho está vazio. Posso buscar algo para você adicionar.',
          showCart: true,
          link: { label: 'Abrir carrinho', path: '/cart' },
        });
        return;
      case 'offers':
      case 'popular':
        this.searchCatalog(message);
        return;
      case 'coupons': {
        const best = [...this.coupons].sort((a, b) => b.discountPercentage - a.discountPercentage)[0];
        this.append({
          role: 'assistant',
          text: /\b(?:melhor|maior)\b/.test(normalizeAssistantText(message)) && best
            ? `O maior desconto disponível é do cupom ${best.code}: ${best.discountPercentage}% OFF. Escolha o cupom para aplicar ao carrinho:`
            : 'Confira os cupons disponíveis. Escolha um para aplicar ao carrinho:',
          showCoupons: true,
          link: { label: 'Detalhes dos cupons', path: '/coupons' },
        });
        return;
      }
      case 'applyCoupon': {
        const coupon = this.couponCatalog.find(intent.code);
        if (coupon) this.applyCoupon(coupon.code);
        else
          this.append({
            role: 'assistant',
            text: `Não encontrei o cupom ${intent.code}. Posso mostrar os cupons disponíveis.`,
            showCoupons: true,
          });
        return;
      }
      case 'navigate':
        void this.router.navigateByUrl(intent.path);
        this.append({
          role: 'assistant',
          text: `Abrindo ${intent.label.toLocaleLowerCase('pt-BR')}.`,
        });
        return;
      case 'search':
      case 'recommend':
        this.searchCatalog(message, intent.type === 'recommend');
        return;
      case 'details':
        this.askAboutProduct('details', intent.query);
        return;
      default:
        this.handleProductAction(intent.type, intent.query, intent.quantity);
    }
  }

  private contextProducts(query: string): ProductModel[] {
    const references = resolveAssistantReferences(query, this.lastResults);
    if (references.length) return references.map((product) => this.products().find((entry) => entry.id === product.id) ?? product);
    const normalizedQuery = normalizeAssistantText(query);
    if (/\b(?:primeir[oa]|segund[oa]|terceir[oa]|quart[oa]|ultim[oa])\b/.test(normalizedQuery) ||
        /^(?:(?:o|a|opcao|produto|item)\s+)?[1-4]$/.test(normalizedQuery)) return [];
    const request = parseAssistantCatalogRequest(query);
    if ((request.query || request.brands?.length) && !hasAssistantReference(query)) {
      return searchAssistantCatalog(this.products(), request).slice(0, 4);
    }
    const focused = this.products().find((product) => product.id === this.lastFocusedProductId);
    if (focused) return [focused];
    if (this.lastResults.length) return this.lastResults.map((product) => this.products().find((entry) => entry.id === product.id) ?? product);
    const currentId = this.router.url.split(/[?#]/)[0].match(/^\/products\/([^/]+)$/)?.[1];
    const current = this.products().find((product) => product.id === currentId);
    return current ? [current] : [];
  }

  private describeProduct(product: ProductModel): void {
    this.append({
      role: 'assistant',
      text: `${product.title}\n${product.description}\nPreço: ${this.price(product.price)}. No Pix: ${this.price(calculatePixPrice(product.price))}. Ou 10x de ${this.price(calculateInstallmentPrice(product.price))} sem juros.\nAvaliação no catálogo: ${product.rating.toFixed(1).replace('.', ',')}/5.`,
      products: [product],
      preserveResultContext: true,
      link: { label: 'Ver detalhes do produto', path: `/products/${product.id}` },
      replyOptions: [
        { label: 'Adicionar 1', prompt: 'Adicionar 1 desse' },
        { label: 'Frete e prazo', prompt: 'Qual o frete desse produto?' },
        { label: 'Por que essa opção?', prompt: 'Por que recomendou esse?' },
      ],
    });
  }

  private askAboutProduct(type: ProductQuestion, query: string): void {
    const feature = type === 'details' && isAssistantFeatureQuestion(query);
    const matches = this.contextProducts(feature && !hasAssistantReference(query) ? '' : query);
    if (matches.length === 1) {
      this.answerProductQuestion(type, matches[0], query);
      return;
    }
    this.pendingQuestion = { type, query };
    const subject = type === 'payment' ? 'calcular o Pix e as parcelas'
      : type === 'shipping' ? 'consultar a entrega' : type === 'explain' ? 'explicar a escolha' : 'conferir essa informação';
    this.append({ role: 'assistant', text: `De qual produto você quer ${subject}? Diga o número da opção ou o nome do produto.`,
      products: matches.length ? matches : undefined, preserveResultContext: true });
  }

  private answerProductQuestion(type: ProductQuestion, product: ProductModel, query: string): void {
    if (type === 'details' && !isAssistantFeatureQuestion(query)) {
      this.describeProduct(product);
      return;
    }
    let text: string;
    if (type === 'shipping') {
      text = `Para consultar frete e prazo de ${product.title}, abra “Calcular pelo seu CEP” na página do produto. O destino, a quantidade e a embalagem entram no cálculo.`;
    } else if (type === 'payment') {
      text = `${product.title}: ${this.price(product.price)}. No Pix, com 10% de desconto, fica ${this.price(calculatePixPrice(product.price))}. Parcelado: 10x de ${this.price(calculateInstallmentPrice(product.price))} sem juros.`;
    } else if (type === 'explain') {
      const request = this.lastCatalogRequest;
      const matchesRequest = request && searchAssistantCatalog([product], request).length > 0;
      const criteria = matchesRequest ? this.describeFilters(request) : '';
      text = `${product.title}: ${this.price(product.price)}, avaliação ${product.rating.toFixed(1).replace('.', ',')}/5${product.brand ? `, marca ${product.brand}` : ''}. ` +
        (matchesRequest ? `Ele atende à sua busca${request.query ? ` por “${request.query}”` : ''}${criteria ? `, ${criteria}` : ''}. ` : '') +
        `A descrição do catálogo informa: ${product.description}` +
        (matchesRequest && request.sort === 'value' ? ' Para ordenar o custo-benefício, considero preço e avaliação; a adequação ao seu uso também depende das características do produto.' : ' Confira se essa finalidade atende ao seu uso.');
    } else {
      text = answerAssistantFeatureQuestion(product, query);
    }
    this.append({ role: 'assistant', text, products: [product], preserveResultContext: true,
      link: { label: type === 'shipping' ? 'Consultar entrega do produto' : 'Ver detalhes do produto', path: `/products/${product.id}` },
      replyOptions: [{ label: 'Adicionar 1', prompt: 'Adicionar 1 desse' }, { label: 'Outras opções', prompt: 'Outras opções' }] });
  }

  private searchCatalog(message: string, recommend = false): void {
    const text = normalizeAssistantText(message);
    const relativeBudget = /mais barat[oa]\w* (?:que|do que)/.test(text);
    let request: AssistantCatalogRequest;
    if (relativeBudget) {
      const reference = this.contextProducts(message);
      if (reference.length !== 1) {
        this.append({ role: 'assistant', text: 'Mais barato que qual produto? Diga, por exemplo, “mais barato que o segundo”.' });
        return;
      }
      request = { ...(this.lastCatalogRequest ?? { query: '', category: reference[0].category }),
        maxPrice: Math.round((reference[0].price - 0.01) * 100) / 100, sort: 'cheapest' };
    } else {
      request = mergeAssistantCatalogRequest(this.lastCatalogRequest, parseAssistantCatalogRequest(message), message);
    }
    if (!request.query && !request.category && request.minPrice === undefined && request.maxPrice === undefined &&
        !request.sort && !request.offersOnly && !request.brands?.length && !request.excludeBrands?.length &&
        !request.excludeTerms?.length && request.minRating === undefined && !/sem limite|qualquer preco/.test(text)) {
      this.append({
        role: 'assistant',
        text: 'Qual tipo de produto você procura e quanto pretende investir? Posso ajudar com irrigação, ferramentas, insumos, pecuária ou agricultura de precisão.',
        replyOptions: ['Irrigação', 'Ferramentas', 'Insumos', 'Pecuária'].map((category) => ({ label: category, prompt: `Buscar ${category}` })),
      });
      return;
    }
    if (recommend && !request.sort) request.sort = 'value';
    if (request.minPrice !== undefined && request.maxPrice !== undefined && request.minPrice > request.maxPrice) {
      this.append({ role: 'assistant', text: 'O valor mínimo ficou maior que o máximo. Informe a faixa desejada, por exemplo “entre R$ 100 e R$ 300”.' });
      return;
    }
    this.lastCatalogRequest = request;
    this.shownProductIds.clear();
    const all = searchAssistantCatalog(this.products(), request);
    if (!all.length) {
      this.lastResults = [];
      this.lastFocusedProductId = undefined;
      this.append({
        role: 'assistant',
        text: `Não encontrei produtos${request.query ? ` para “${request.query}”` : ''}${request.maxPrice !== undefined ? ` até ${this.price(request.maxPrice)}` : ''}${request.minPrice !== undefined ? ` a partir de ${this.price(request.minPrice)}` : ''}. Podemos ampliar o orçamento ou tentar outra descrição.`,
        replyOptions: [
          ...(request.maxPrice !== undefined || request.minPrice !== undefined ? [{ label: 'Sem limite de preço', prompt: 'Sem limite de preço' }] : []),
          { label: 'Nova busca', prompt: 'Recomeçar busca' },
        ],
        link: { label: 'Explorar catálogo', path: '/products' },
      });
      return;
    }
    const matches = all.slice(0, 4);
    matches.forEach((product) => this.shownProductIds.add(product.id));
    const filters = this.describeFilters(request);
    this.append({
      role: 'assistant',
      text: `Encontrei ${all.length} ${all.length === 1 ? 'opção' : 'opções'}${request.query ? ` para “${request.query}”` : ''}${filters ? `, ${filters}` : ''}.${all.length > matches.length ? ` Mostro as ${matches.length} primeiras.` : ''} ${recommend ? `A primeira é ${matches[0].title}: ${matches[0].description} ` : ''}Você pode pedir detalhes pelo número da opção.`,
      products: matches,
      replyOptions: this.catalogReplies(matches, all.length > matches.length),
      link: { label: 'Ver no catálogo', path: '/products', queryParams: request.query ? { search: request.query } : undefined },
    });
  }

  private describeFilters(request: AssistantCatalogRequest): string {
    return [
      request.minPrice !== undefined ? `a partir de ${this.price(request.minPrice)}` : '',
      request.maxPrice !== undefined ? `até ${this.price(request.maxPrice)}` : '',
      request.brands?.length ? `marca ${request.brands.join(' ou ')}` : '',
      request.excludeBrands?.length ? `exceto ${request.excludeBrands.join(', ')}` : '',
      request.excludeTerms?.length ? `sem ${request.excludeTerms.join(', ')}` : '',
      request.minRating !== undefined ? `avaliação a partir de ${request.minRating.toFixed(1).replace('.', ',')}/5` : '',
      request.offersOnly ? 'somente ofertas' : '',
      request.sort === 'cheapest' ? 'do menor para o maior preço' : '',
      request.sort === 'rating' ? 'pelas melhores avaliações' : '',
      request.sort === 'popular' ? 'pelos mais procurados' : '',
      request.sort === 'value' ? 'equilibrando preço e avaliação' : '',
    ].filter(Boolean).join(', ');
  }

  private catalogReplies(products: ProductModel[], hasMore: boolean): NonNullable<ChatMessage['replyOptions']> {
    return [
      ...(hasMore ? [{ label: 'Outras opções', prompt: 'Outras opções' }] : []),
      { label: 'Mais baratos', prompt: 'Mostre opções mais baratas' },
      ...(products.length > 1 ? [{ label: 'Comparar opções', prompt: 'Compare o primeiro com o segundo' }] : []),
      { label: 'Detalhes do primeiro', prompt: 'Fale sobre o primeiro' },
    ];
  }

  private showMoreProducts(): void {
    if (!this.lastCatalogRequest) {
      this.append({ role: 'assistant', text: 'Posso buscar mais opções. Diga uma categoria, um uso ou seu orçamento para começar.' });
      return;
    }
    const remaining = searchAssistantCatalog(this.products(), this.lastCatalogRequest)
      .filter((product) => !this.shownProductIds.has(product.id));
    const matches = remaining.slice(0, 4);
    if (!matches.length) {
      this.append({ role: 'assistant', text: 'Você já viu todas as opções que atendem a essa busca. Podemos mudar o orçamento ou começar uma nova busca.',
        replyOptions: [{ label: 'Nova busca', prompt: 'Recomeçar busca' },
          ...(this.lastCatalogRequest.maxPrice !== undefined || this.lastCatalogRequest.minPrice !== undefined
            ? [{ label: 'Sem limite de preço', prompt: 'Sem limite de preço' }] : [])] });
      return;
    }
    matches.forEach((product) => this.shownProductIds.add(product.id));
    this.append({
      role: 'assistant',
      text: `Aqui estão mais ${matches.length} ${matches.length === 1 ? 'opção' : 'opções'} da mesma busca, mantendo seus filtros. Os números agora se referem a esta nova lista.`,
      products: matches,
      replyOptions: this.catalogReplies(matches, remaining.length > matches.length),
    });
  }

  private compareProducts(query: string): void {
    const normalized = normalizeAssistantText(query);
    let selected = resolveAssistantReferences(query, this.lastResults);
    const explicitReference = /\b(?:primeir[oa]|segund[oa]|terceir[oa]|quart[oa]|ultim[oa])\b/.test(normalized);
    if (!selected.length && !explicitReference) {
      const names = normalizeAssistantText(query)
        .replace(/^(?:compare|comparar|compara|comparacao (?:de|entre)|qual (?:e )?a diferenca entre)\s+/, '')
        .split(/\s+(?:com|e|versus|vs)\s+/);
      if (names.length > 1) {
        selected = names.flatMap((name) => {
          const request = parseAssistantCatalogRequest(name);
          return request.query || request.brands?.length ? searchAssistantCatalog(this.products(), request).slice(0, 1) : [];
        });
      } else if (this.lastResults.length >= 2) selected = /\b(?:os dois|as duas|ambos|ambas)\b/.test(normalized) ? this.lastResults.slice(0, 2) : this.lastResults;
      else {
        const request = parseAssistantCatalogRequest(query);
        if (request.query) selected = searchAssistantCatalog(this.products(), request);
      }
    }
    selected = [...new Map(selected.map((product) => [product.id, product])).values()].slice(0, 4)
      .map((product) => this.products().find((entry) => entry.id === product.id) ?? product);
    if (selected.length < 2) {
      this.append({ role: 'assistant', text: 'Para comparar, preciso de pelo menos dois produtos. Busque uma categoria e diga “compare o primeiro com o segundo”, ou informe os dois nomes.' });
      return;
    }
    const cheapest = [...selected].sort((a, b) => a.price - b.price)[0];
    const highestRated = [...selected].sort((a, b) => b.rating - a.rating)[0];
    const mostExpensive = [...selected].sort((a, b) => b.price - a.price)[0];
    const purpose = normalized.match(/\bpara\s+(.+)$/)?.[1];
    const forPurpose = purpose ? searchAssistantCatalog(selected, parseAssistantCatalogRequest(purpose)) : [];
    const purposeAdvice = forPurpose.length === 1
      ? ` Para “${purpose}”, ${forPurpose[0].title} é a opção cuja descrição corresponde à busca: ${forPurpose[0].description}` : '';
    this.append({
      role: 'assistant',
      text: `Comparei preço, avaliação e finalidade descrita no catálogo. ${cheapest.title} tem o menor preço: ${this.price(cheapest.price)}${mostExpensive.price > cheapest.price ? `, ${this.price(mostExpensive.price - cheapest.price)} abaixo da opção mais cara` : ''}. A maior nota entre essas opções é ${highestRated.rating.toFixed(1).replace('.', ',')}/5, de ${highestRated.title}.${purposeAdvice} ${new Set(selected.map((product) => product.category)).size > 1 ? 'Esses produtos pertencem a categorias diferentes; confira a finalidade antes de escolher pelo preço.' : 'Confira qual finalidade combina com o seu uso.'}`,
      products: selected,
      comparison: true,
      preserveResultContext: true,
      replyOptions: [
        { label: 'Detalhes do primeiro', prompt: 'Fale sobre o primeiro' },
        { label: 'Detalhes do segundo', prompt: 'Fale sobre o segundo' },
      ],
    });
  }

  private explainPayment(query: string): void {
    if (/\b(?:carrinho|total|tudo)\b/.test(normalizeAssistantText(query)) && this.cartCount()) {
      this.append({
        role: 'assistant',
        text: `O total atual do carrinho é ${this.price(this.cartTotal())}${this.currentCoupon() ? `, com o cupom ${this.currentCoupon()!.code}` : ''}. Com os 10% de desconto no Pix exibidos pela loja, fica ${this.price(calculatePixPrice(this.cartTotal()))}. Confira o resumo do pedido para concluir sua escolha.`,
        showCart: true,
        link: { label: 'Conferir carrinho', path: '/cart' },
      });
      return;
    }
    this.askAboutProduct('payment', query);
  }

  private handleProductAction(action: ProductAction, query: string, quantity: number): void {
    if (!Number.isSafeInteger(quantity) || quantity < 0 || quantity > 99 || (action !== 'remove' && quantity === 0)) {
      this.append({
        role: 'assistant',
        text: 'Diga o nome do produto e uma quantidade entre 1 e 99. Exemplo: “adicionar 2 sementes de milho”.',
      });
      return;
    }

    const source =
      action === 'add' ? this.products() : this.cartItems().map((item) => item.product);
    const context = (!query || hasAssistantReference(query)) ? this.contextProducts(query) : [];
    const matches = context.length ? context.filter((product) => source.some((item) => item.id === product.id))
      : !query && source.length === 1 ? source : hasAssistantReference(query) ? [] : findAssistantProducts(source, query);
    if (!matches.length) {
      this.append({
        role: 'assistant',
        text:
          action === 'add'
            ? 'Não encontrei esse produto no catálogo. Tente um nome mais curto.'
            : 'Não encontrei esse produto no seu carrinho.',
        link:
          action === 'add'
            ? { label: 'Explorar catálogo', path: '/products' }
            : { label: 'Ver carrinho', path: '/cart' },
      });
      return;
    }

    const normalizedQuery = normalizeAssistantText(query);
    const exact = matches.filter(
      (product) => normalizeAssistantText(product.title) === normalizedQuery,
    );
    const containing = matches.filter((product) =>
      normalizeAssistantText(product.title).includes(normalizedQuery),
    );
    const selected =
      exact.length === 1
        ? exact[0]
        : containing.length === 1
          ? containing[0]
          : matches.length === 1
            ? matches[0]
            : null;

    if (selected) {
      this.actOnProduct(selected, action, quantity);
    } else {
      this.pendingProductAction = { action, quantity };
      this.append({
        role: 'assistant',
        text: 'Encontrei mais de um produto. Escolha o item certo antes de alterar o carrinho:',
        products: matches,
        productAction: action,
        quantity,
      });
    }
  }

  private actOnProduct(product: ProductModel, action: ProductAction, quantity: number): void {
    this.pendingProductAction = undefined;
    this.lastFocusedProductId = product.id;
    if (action !== 'remove' && (!Number.isSafeInteger(quantity) || quantity < 1 || quantity > 99)) {
      this.append({ role: 'assistant', text: 'A quantidade deve ficar entre 1 e 99 unidades.' });
      return;
    }
    if (action === 'add') {
      const latest = this.products().find((entry) => entry.id === product.id);
      if (!latest) {
        this.append({ role: 'assistant', text: 'Esse produto não está mais no catálogo. Posso procurar outra opção.' });
        return;
      }
      product = latest;
    }
    const item = this.cartItems().find((entry) => entry.product.id === product.id);

    if (action === 'add') {
      if ((item?.quantity ?? 0) + quantity > 99) {
        this.append({
          role: 'assistant',
          text: 'O limite é de 99 unidades por produto no carrinho.',
        });
        return;
      }
      this.cart.addCartItem(product, quantity);
      this.append({
        role: 'assistant',
        text: `${quantity} ${quantity === 1 ? 'unidade adicionada' : 'unidades adicionadas'}: ${product.title}. Agora seu carrinho tem ${this.cartCount()} ${this.cartCount() === 1 ? 'item' : 'itens'}.`,
        link: { label: 'Ver carrinho', path: '/cart' },
      });
      return;
    }

    if (!item) {
      this.append({ role: 'assistant', text: 'Esse produto não está mais no carrinho.' });
      return;
    }

    if (action === 'remove') {
      this.cart.removeCartItem(item.product);
      this.append({
        role: 'assistant',
        text: `${product.title} foi removido do carrinho.`,
        link: { label: 'Ver carrinho', path: '/cart' },
      });
      return;
    }

    const nextQuantity =
      action === 'setQuantity'
        ? quantity
        : item.quantity + (action === 'increase' ? quantity : -quantity);
    if (!this.cart.setItemQuantity(product.id, nextQuantity)) {
      this.append({
        role: 'assistant',
        text: 'A quantidade deve ficar entre 1 e 99. Para retirar o produto, peça “remover” seguido do nome.',
      });
      return;
    }
    this.append({
      role: 'assistant',
      text: `Quantidade de ${product.title} atualizada para ${nextQuantity}.`,
      link: { label: 'Ver carrinho', path: '/cart' },
    });
  }

  private append(message: Omit<ChatMessage, 'id'>): void {
    if (message.role === 'assistant' && message.products?.length) {
      const products = message.products;
      if (!message.preserveResultContext || !this.lastResults.length) this.lastResults = products;
      message = {
        ...message,
        optionNumbers: products.map((product, index) => {
          const originalIndex = this.lastResults.findIndex((entry) => entry.id === product.id);
          return originalIndex >= 0 ? originalIndex + 1 : index + 1;
        }),
      };
      this.lastFocusedProductId = products.length === 1 ? products[0].id : undefined;
    }
    const id = this.nextMessageId++;
    const reducedMotion = this.document.defaultView?.matchMedia?.(
      '(prefers-reduced-motion: reduce)',
    ).matches;
    if (message.role === 'assistant' && this.browser && !reducedMotion) {
      this.isTyping.set(true);
      this.messages.update((current) => [
        ...current.slice(-39),
        { id, role: 'assistant', text: '', typing: true },
      ]);
      this.scrollToLatest();

      const characters = Array.from(message.text);
      // Keep longer replies readable without making the animation take too long.
      const charactersPerTick = Math.max(1, Math.ceil(characters.length / 120));
      let visibleCharacters = 0;
      const typeNext = () => {
        visibleCharacters = Math.min(visibleCharacters + charactersPerTick, characters.length);
        const complete = visibleCharacters === characters.length;
        this.messages.update((current) =>
          current.map((entry) =>
            entry.id !== id
              ? entry
              : complete
                ? { ...message, id }
                : { ...entry, text: characters.slice(0, visibleCharacters).join('') },
          ),
        );
        this.scrollToLatest();
        if (complete) {
          this.isTyping.set(false);
          this.typingTimer = undefined;
        } else {
          this.typingTimer = setTimeout(typeNext, 24);
        }
      };
      this.typingTimer = setTimeout(typeNext, 500);
      return;
    }
    this.messages.update((current) => [...current.slice(-39), { ...message, id }]);
    this.scrollToLatest();
  }

  private scrollToLatest(): void {
    clearTimeout(this.scrollTimer);
    this.scrollTimer = setTimeout(() => {
      const list = this.messageList?.nativeElement;
      if (list) list.scrollTop = list.scrollHeight;
    });
  }
}
