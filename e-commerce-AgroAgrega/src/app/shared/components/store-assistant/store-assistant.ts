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
  input,
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
import { AssistantSession, ChatMessage, CartUndo, ProductAction, ProductQuestion } from './assistant-session';
import { parseAssistantPaymentRequest } from './assistant-payment';
import { buildAssistantShoppingPlan, detectAssistantShoppingPlan } from './assistant-workflows';
import { OrderService } from '../../../core/services/order/order.service';
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

@Component({
  selector: 'app-store-assistant',
  imports: [FormsModule, RouterLink],
  templateUrl: './store-assistant.html',
  styleUrl: './store-assistant.css',
  host: { '[class.assistant-embedded]': 'embedded()' },
})
export class StoreAssistant {
  readonly embedded = input(false);
  private readonly productService = inject(ProductService);
  private readonly cart = inject(Cart);
  private readonly orders = inject(OrderService);
  private readonly session = inject(AssistantSession);
  private readonly auth = inject(Auth);
  private sessionOwner = this.auth.currentUserId();
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

  private completedReply?: ChatMessage;
  private nextTaskTimer?: ReturnType<typeof setTimeout>;
  private pendingTasks: string[] = [];
  readonly taskProgress = signal<{ current: number; total: number } | null>(null);
  readonly processingLabel = signal('Tourino está respondendo');
  readonly hasNewMessages = signal(false);
  private followMessages = true;

  @ViewChild('composer') private composer?: ElementRef<HTMLTextAreaElement>;
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
  readonly selectedCartTotal = this.cart.selectedTotal;
  readonly isCartItemSelected = (id: string) => this.cart.isProductSelected(id);
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
    this.restoreSession();
    effect(() => {
      this.syncSession();
    });
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
            if (this.open() && !this.embedded()) this.composer?.nativeElement.focus();
          }, 50);
          this.scrollToLatest();
          if (!this.embedded() && !reducedMotion && this.messages().length === 1) {
            this.startIntroduction();
          }
        }, this.embedded() ? 500 : 5000);
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
      clearTimeout(this.nextTaskTimer);
    });
  }

  private restoreSession(): void {
    const saved = this.session.read(this.sessionOwner);
    if (!saved) return;
    this.messages.set(saved.messages);
    this.nextMessageId = saved.nextMessageId;
    this.lastResults = saved.lastResults;
    this.lastFocusedProductId = saved.lastFocusedProductId;
    this.lastCatalogRequest = saved.lastCatalogRequest;
    this.pendingProductAction = saved.pendingProductAction;
    this.pendingQuestion = saved.pendingQuestion;
    this.shownProductIds = new Set(saved.shownProductIds);
    this.cartUndo = saved.cartUndo;
  }

  private syncSession(): void {
    const owner = this.auth.currentUserId();
    if (owner !== this.sessionOwner) {
      this.sessionOwner = owner;
      this.resetConversation(false);
      this.restoreSession();
    }
  }

  private saveSession(messages = this.messages()): void {
    this.session.save(this.sessionOwner, {
      messages, nextMessageId: this.nextMessageId, lastResults: this.lastResults,
      lastFocusedProductId: this.lastFocusedProductId, lastCatalogRequest: this.lastCatalogRequest,
      pendingProductAction: this.pendingProductAction, pendingQuestion: this.pendingQuestion,
      shownProductIds: [...this.shownProductIds], cartUndo: this.cartUndo,
    });
  }

  resetConversation(save = true): void {
    clearTimeout(this.typingTimer);
    clearTimeout(this.introTimer);
    clearTimeout(this.nextTaskTimer);
    this.pendingTasks = [];
    this.taskProgress.set(null);
    this.completedReply = undefined;
    this.hasNewMessages.set(false);
    this.followMessages = true;
    this.isTyping.set(false);
    this.isIntroducing.set(false);
    this.messages.set([{ id: 0, role: 'assistant', text: 'Como posso ajudar?' }]);
    this.nextMessageId = 1;
    this.lastResults = [];
    this.lastFocusedProductId = undefined;
    this.lastCatalogRequest = undefined;
    this.pendingProductAction = undefined;
    this.pendingQuestion = undefined;
    this.shownProductIds.clear();
    this.cartUndo = undefined;
    this.draft = '';
    if (save) this.saveSession();
  }

  toggle(): void {
    if (!this.open()) this.isStarting.set(true);
    this.open.update((value) => !value);
  }

  close(): void {
    if (this.embedded()) return;
    this.stopSequence();
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
    const message = this.draft.trim().slice(0, 1200);
    if (!message) return;
    this.draft = '';
    this.submitPrompt(message);
  }

  submitPrompt(message: string): void {
    this.syncSession();
    message = message.trim().slice(0, 1200);
    if (!message) return;
    const nextIntent = interpretAssistantMessage(message);
    const continueChoice = !!(this.pendingProductAction || this.pendingQuestion) && this.pendingTasks.length > 0 &&
      (nextIntent.type === 'select' || (nextIntent.type === 'search' && !/^(?:buscar|busque|procure|pesquise|quero|agora|mostre)\b/.test(normalizeAssistantText(message))));
    if (!continueChoice) this.stopSequence();
    this.finishResponse(false);
    this.followMessages = true;
    this.hasNewMessages.set(false);
    if (this.isIntroducing()) this.finishIntroduction();
    this.append({ role: 'user', text: message });
    if (continueChoice) {
      this.respond(message);
      return;
    }
    const tasks = message.split(/\s*;\s*|\n+|\s+e depois\s+/i).map(task => task.trim()).filter(Boolean);
    if (tasks.length > 3) {
      this.append({ role: 'assistant', text: 'Consigo organizar até 3 pedidos por mensagem. Envie os três primeiros e continuamos em seguida.' });
      return;
    }
    this.pendingTasks = tasks.slice(1);
    this.taskProgress.set(tasks.length > 1 ? { current: 1, total: tasks.length } : null);
    this.respond(tasks[0] ?? message);
  }

  onComposerKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter' && !event.shiftKey && !event.isComposing) {
      event.preventDefault();
      this.send();
    }
  }

  finishResponse(continueSequence = true): void {
    if (this.completedReply) {
      clearTimeout(this.typingTimer);
      const reply = this.completedReply;
      this.messages.update(messages => messages.map(message => message.id === reply.id ? reply : message));
      this.completedReply = undefined;
      this.isTyping.set(false);
      this.saveSession();
      this.scrollToLatest();
    }
    if (continueSequence) this.scheduleNextTask();
  }

  stopSequence(): void {
    clearTimeout(this.nextTaskTimer);
    this.pendingTasks = [];
    this.taskProgress.set(null);
  }

  waitingForChoice(): boolean {
    return !!(this.pendingProductAction || this.pendingQuestion);
  }

  private scheduleNextTask(): void {
    clearTimeout(this.nextTaskTimer);
    if (this.pendingProductAction || this.pendingQuestion) return;
    if (!this.pendingTasks.length) {
      this.stopSequence();
      return;
    }
    this.nextTaskTimer = setTimeout(() => {
      this.syncSession();
      if (this.isTyping()) return;
      const next = this.pendingTasks.shift();
      if (!next) return;
      this.taskProgress.update(progress => progress ? { ...progress, current: progress.current + 1 } : null);
      this.respond(next);
    }, 180);
  }

  onMessageScroll(): void {
    const list = this.messageList?.nativeElement;
    if (!list) return;
    this.followMessages = list.scrollHeight - list.scrollTop - list.clientHeight < 72;
    if (this.followMessages) this.hasNewMessages.set(false);
  }

  showLatestMessages(): void {
    this.followMessages = true;
    this.hasNewMessages.set(false);
    this.scrollToLatest();
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
    if (!this.couponCatalog.find(code)) {
      this.append({
        role: 'assistant',
        text: 'Este cupom venceu ou não está disponível. Confira os cupons de hoje:',
        showCoupons: true,
      });
      return;
    }
    this.cart.applyCoupon(code);
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
    if (detectAssistantShoppingPlan(message)) {
      this.pendingProductAction = undefined;
      this.pendingQuestion = undefined;
      const plan = buildAssistantShoppingPlan(this.products(), message, this.lastCatalogRequest);
      this.lastCatalogRequest = plan.request;
      if (!plan.products.length) {
        this.append({ role: 'assistant', text: 'Não encontrei uma seleção dentro desses critérios. Tente aumentar o orçamento ou mudar o tipo de produto. Nenhum item foi adicionado ao carrinho.' });
        return;
      }
      this.append({ role: 'assistant',
        text: `Separei ${plan.products.length} ${plan.products.length === 1 ? 'produto' : 'produtos'} do catálogo${plan.budget !== undefined ? ` dentro do orçamento total de ${this.price(plan.budget)}` : ''}. Compare as opções abaixo antes de adicionar. Esta é uma sugestão de compra; não confirma compatibilidade técnica entre os itens.`,
        products: plan.products,
        shoppingPlan: { productIds: plan.products.map(product => product.id), total: plan.total, budget: plan.budget },
        replyOptions: [{ label: 'Comparar seleção', prompt: 'Compare todos' }, { label: 'Explicar primeiro', prompt: 'Por que o primeiro?' }],
      });
      return;
    }
    if (/^(?:aplique|aplicar|use|usar|ative|ativar)\s+(?:automaticamente\s+)?(?:o\s+)?(?:melhor cupom|cupom (?:com (?:o )?)?maior desconto)\b/.test(normalizeAssistantText(message))) {
      this.pendingProductAction = undefined;
      this.pendingQuestion = undefined;
      if (!this.cart.selectedItemsCount()) {
        this.summarizeCart(message);
        return;
      }
      this.couponCatalog.refresh();
      const best = [...this.coupons].sort((a, b) => b.discountPercentage - a.discountPercentage)[0];
      if (best && best.discountPercentage > (this.currentCoupon()?.discountPercentage ?? 0)) this.applyCoupon(best.code);
      else this.summarizeCart(message);
      return;
    }
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
          text: 'Sou o Tourino! Posso montar uma seleção dentro do seu orçamento, buscar por uso e marca, comparar produtos e calcular quantidades, Pix e parcelas. Experimente “monte uma seleção de ferramentas até R$ 1000” ou “buscar irrigação até R$ 800; compare o primeiro com o segundo”.\nTambém organizo seu carrinho, aplico o melhor cupom quando você pede, consulto seus pedidos e desfaço minha última alteração. Consigo seguir até três pedidos por mensagem e pauso quando preciso que você escolha um produto. A conversa continua quando você visita um produto e volta ao Tourino.',
          replyOptions: [
            { label: 'Montar seleção', prompt: 'Monte uma seleção de ferramentas até R$ 1000' },
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
      case 'orders':
        this.showOrders(intent.query);
        return;
      case 'cart':
        this.summarizeCart(message);
        return;
      case 'offers':
      case 'popular':
        this.searchCatalog(message);
        return;
      case 'coupons': {
        if (/\b(?:melhor|maior|economizar|economia)\b/.test(normalizeAssistantText(message)) && this.cartCount()) {
          this.summarizeCart(message);
          return;
        }
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
        this.stopSequence();
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
    const namedFeature = feature ? normalizeAssistantText(query).match(/(?:voltagem|tensao|potencia|capacidade|peso|alcance)\s+(?:do|da|de)\s+(.+)$/)?.[1] : undefined;
    const payment = type === 'payment' ? parseAssistantPaymentRequest(query) : undefined;
    const matches = this.contextProducts(payment?.query ?? namedFeature ?? ((feature || type === 'explain') && !hasAssistantReference(query) ? '' : query));
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
      this.quoteProduct(product, query);
      return;
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
    const relativeBudget = /(?:mais barat[oa]\w*|menos car[oa]\w*) (?:que|do que)/.test(text);
    let request: AssistantCatalogRequest;
    if (relativeBudget) {
      const reference = this.contextProducts(text.replace(/^.*?(?:mais barat[oa]\w*|menos car[oa]\w*) (?:que|do que)\s*/, ''));
      if (reference.length !== 1) {
        this.append({ role: 'assistant', text: 'Mais barato que qual produto? Diga, por exemplo, “mais barato que o segundo”.' });
        return;
      }
      request = { ...(this.lastCatalogRequest ?? { query: '', category: reference[0].category }),
        maxPrice: Math.round((reference[0].price - 0.01) * 100) / 100, sort: 'cheapest' };
    } else if (/\b(?:dessa|desta|mesma) marca\b/.test(text)) {
      const reference = this.contextProducts('');
      if (reference.length !== 1 || !reference[0].brand) {
        this.append({ role: 'assistant', text: 'Qual marca você prefere? Diga o nome da marca ou escolha um produto primeiro.' });
        return;
      }
      const brandedMessage = message.replace(/(?:dessa|desta|mesma) marca/i, reference[0].brand);
      request = mergeAssistantCatalogRequest(this.lastCatalogRequest, parseAssistantCatalogRequest(brandedMessage), brandedMessage);
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
        text: `Não encontrei produtos${request.query ? ` para “${request.query}”` : ''}${this.describeFilters(request) ? ` com esses critérios: ${this.describeFilters(request)}` : ''}. Podemos ajustar os filtros ou tentar outra descrição.`,
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
    const preserveNumbers = selected.every((product) => this.lastResults.some((entry) => entry.id === product.id));
    this.append({
      role: 'assistant',
      text: `Comparei preço, avaliação e finalidade descrita no catálogo. ${cheapest.title} tem o menor preço: ${this.price(cheapest.price)}${mostExpensive.price > cheapest.price ? `, ${this.price(mostExpensive.price - cheapest.price)} abaixo da opção mais cara` : ''}. A maior nota entre essas opções é ${highestRated.rating.toFixed(1).replace('.', ',')}/5, de ${highestRated.title}.${purposeAdvice} ${new Set(selected.map((product) => product.category)).size > 1 ? 'Esses produtos pertencem a categorias diferentes; confira a finalidade antes de escolher pelo preço.' : 'Confira qual finalidade combina com o seu uso.'}`,
      products: selected,
      comparison: true,
      preserveResultContext: true,
      replyOptions: selected.slice(0, 2).map((product, index) => {
        const number = preserveNumbers ? this.lastResults.findIndex((entry) => entry.id === product.id) + 1 : index + 1;
        return { label: `Detalhes da opção ${number}`, prompt: `Fale sobre a opção ${number}` };
      }),
    });
  }

  private explainPayment(query: string): void {
    if (/\b(?:carrinho|total|tudo)\b/.test(normalizeAssistantText(query)) && !/\b(?:unidades?|desse|desses|dessa|dessas)\b/.test(normalizeAssistantText(query))) {
      this.summarizeCart(query);
      return;
    }
    const { quantity, installments } = parseAssistantPaymentRequest(query);
    if (!Number.isInteger(quantity) || quantity < 1 || quantity > 99) {
      this.append({ role: 'assistant', text: 'Para calcular, informe uma quantidade inteira entre 1 e 99 unidades.' });
      return;
    }
    if (installments < 1 || installments > 10) {
      this.append({ role: 'assistant', text: 'A loja oferece de 1 a 10 parcelas. Diga em quantas parcelas você quer simular.' });
      return;
    }
    this.askAboutProduct('payment', query);
  }

  private quoteProduct(product: ProductModel, query: string): void {
    const { quantity, installments } = parseAssistantPaymentRequest(query);
    const total = Math.round(product.price * quantity * 100) / 100;
    const pix = calculatePixPrice(total);
    this.append({
      role: 'assistant',
      text: `${quantity} ${quantity === 1 ? 'unidade' : 'unidades'} de ${product.title}:\n${this.price(product.price)} por unidade × ${quantity} = ${this.price(total)}.\nNo Pix: ${this.price(pix)} (economia de ${this.price(total - pix)}).\nEm ${installments}x: aproximadamente ${this.price(total / installments)} por parcela, sem juros.\nValores sem cupom e frete.`,
      products: [product], preserveResultContext: true,
      replyOptions: [
        { label: `Adicionar ${quantity}`, prompt: `Adicionar ${quantity} desse` },
        { label: 'Comparar opções', prompt: 'Compare os dois' },
      ],
    });
  }

  private summarizeCart(query: string): void {
    const count = this.cart.selectedItemsCount();
    if (!count) {
      this.append({ role: 'assistant', text: this.cartCount()
        ? 'Seu carrinho tem produtos, mas nenhum está selecionado para a compra. Selecione os itens no carrinho para eu calcular os valores.'
        : 'Seu carrinho está vazio. Diga o produto e o orçamento para eu ajudar na escolha.',
        showCart: true, link: { label: 'Ver carrinho', path: '/cart' } });
      return;
    }
    this.couponCatalog.refresh();
    const total = this.cart.selectedTotal();
    const subtotal = this.cart.selectedSubtotal();
    const best = [...this.coupons].sort((a, b) => b.discountPercentage - a.discountPercentage)[0];
    const bestDiscount = best ? subtotal * best.discountPercentage / 100 : 0;
    const extraSavings = Math.max(0, bestDiscount - this.cart.selectedCouponDiscount());
    const budget = parseAssistantCatalogRequest(query).maxPrice;
    const comparedTotal = /\bpix\b/.test(normalizeAssistantText(query)) ? this.cart.selectedPixTotal() : total;
    let budgetText = '';
    if (budget !== undefined) {
      const difference = Math.round((budget - comparedTotal) * 100) / 100;
      budgetText = difference >= 0 ? `\nDentro do orçamento de ${this.price(budget)}: sobram ${this.price(difference)} antes do frete.`
        : `\nO valor ultrapassa seu orçamento de ${this.price(budget)} em ${this.price(-difference)}, antes do frete.`;
    }
    const couponText = best && extraSavings >= .01
      ? `\nO cupom ${best.code} (${best.discountPercentage}% OFF) economizaria mais ${this.price(extraSavings)} em relação ao total atual. Você pode aplicá-lo abaixo.`
      : '\nSeu desconto atual já é tão bom quanto os cupons disponíveis para este cálculo.';
    this.append({ role: 'assistant',
      text: `Resumo dos ${count} itens selecionados para a compra:\nProdutos: ${this.price(subtotal)}.\nDesconto do cupom${this.currentCoupon() ? ` ${this.currentCoupon()!.code}` : ''}: ${this.price(this.cart.selectedCouponDiscount())}.\nTotal: ${this.price(total)}.\nNo Pix: ${this.price(this.cart.selectedPixTotal())}, com mais ${this.price(this.cart.selectedPixDiscount())} de economia.\nOu 10x de aproximadamente ${this.price(total / 10)} sem juros. Valores antes do frete.${budgetText}${couponText}`,
      showCart: true,
      replyOptions: best && extraSavings >= .01 ? [{ label: `Aplicar ${best.discountPercentage}% OFF`, prompt: `Aplicar cupom ${best.code}` }] : undefined,
      link: { label: 'Conferir itens selecionados', path: '/cart' },
    });
  }

  private showOrders(query: string): void {
    const userId = this.auth.currentUserId();
    if (!userId) {
      this.append({ role: 'assistant', text: 'Entre na sua conta para eu consultar seus pedidos.', link: { label: 'Entrar na minha conta', path: '/login' } });
      return;
    }
    const orders = this.orders.getOrdersByUserId(userId).sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));
    const requestedId = query.match(/(?:pedido\s*#?|#)\s*([a-z0-9-]*\d[a-z0-9-]*)/i)?.[1];
    const matches = requestedId ? orders.filter(order => order.id.toLowerCase() === requestedId.toLowerCase())
      : /\bultimo\b/.test(normalizeAssistantText(query)) ? orders.slice(0, 1) : orders.slice(0, 3);
    if (!matches.length) {
      this.append({ role: 'assistant', text: requestedId ? 'Não encontrei esse pedido na sua conta. Confira o número em Meus pedidos.' : 'Ainda não encontrei pedidos nesta conta.', link: { label: 'Meus pedidos', path: '/orders' } });
      return;
    }
    const date = new Intl.DateTimeFormat('pt-BR', { timeZone: 'America/Sao_Paulo' });
    this.append({ role: 'assistant',
      text: 'Estas são as informações registradas na sua conta:\n' + matches.map(order => `Pedido #${order.id} · ${date.format(new Date(order.createdAt))}\nStatus: ${order.status}. Total: ${this.price(order.total)}.`).join('\n\n') + '\nAbra o pedido para conferir os detalhes. Não há localização da transportadora em tempo real nesta consulta.',
      link: { label: matches.length === 1 ? 'Ver este pedido' : 'Ver todos os pedidos', path: matches.length === 1 ? `/orders/${matches[0].id}` : '/orders' },
      replyOptions: matches.length > 1 ? matches.map(order => ({ label: `Pedido #${order.id}`, prompt: `Status do pedido ${order.id}` })) : undefined,
    });
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

  private cartFingerprint(): string {
    return JSON.stringify({
      user: this.auth.currentUserId(),
      coupon: this.currentCoupon()?.code,
      items: this.cartItems().map((item) => ({ id: item.product.id, quantity: item.quantity,
        price: item.product.price, selected: this.cart.isProductSelected(item.product.id) })),
    });
  }

  addShoppingPlan(message: ChatMessage): void {
    this.syncSession();
    const current = this.messages().find(entry => entry.id === message.id);
    const plan = current?.shoppingPlan;
    if (!plan || plan.applied || this.isTyping()) return;
    const ids = [...new Set(plan.productIds)];
    const products = ids.map(id => this.products().find(product => product.id === id));
    if (!ids.length || ids.length > 3 || products.some(product => !product)) {
      this.append({ role: 'assistant', text: 'A seleção mudou no catálogo. Peça uma nova seleção para eu conferir os produtos disponíveis.' });
      return;
    }
    const selection = products as ProductModel[];
    const total = Math.round(selection.reduce((sum, product) => sum + product.price, 0) * 100) / 100;
    if (total !== plan.total || (plan.budget !== undefined && total > plan.budget)) {
      this.append({ role: 'assistant', text: 'Os preços dessa seleção mudaram. Monte uma nova seleção para revisar os valores antes de adicionar ao carrinho.', products: selection });
      return;
    }
    const previousItems = selection.map(product => {
      const item = this.cartItems().find(item => item.product.id === product.id);
      return { product: item?.product ?? product, quantity: item?.quantity ?? 0, selected: this.cart.isProductSelected(product.id) };
    });
    if (previousItems.some(item => item.quantity >= 99)) {
      this.append({ role: 'assistant', text: 'Um dos produtos já atingiu o limite de 99 unidades. Ajuste a quantidade no carrinho antes de adicionar a seleção.', showCart: true });
      return;
    }
    for (const product of selection) this.cart.addCartItem(product, 1);
    this.messages.update(messages => messages.map(entry => entry.id === current!.id
      ? { ...entry, shoppingPlan: { ...plan, applied: true } } : entry));
    this.cartUndo = { type: 'selection', items: previousItems, messageId: current!.id, expectedState: this.cartFingerprint() };
    this.append({ role: 'assistant', text: `Adicionei uma unidade de cada um dos ${selection.length} produtos da seleção. Confira os itens e valores no carrinho.`, showCart: true,
      replyOptions: [{ label: 'Desfazer seleção', prompt: 'Desfazer última alteração' }, { label: 'Aplicar melhor cupom', prompt: 'Aplique o melhor cupom' }],
      link: { label: 'Ver carrinho', path: '/cart' } });
  }

  private undoCartChange(): void {
    const previous = this.cartUndo;
    if (!previous) {
      this.append({ role: 'assistant', text: 'Ainda não há uma alteração minha para desfazer nesta conversa.' });
      return;
    }
    this.cartUndo = undefined;
    if (previous.expectedState !== this.cartFingerprint()) {
      this.append({ role: 'assistant', text: 'O carrinho mudou depois da minha última alteração. Confira os itens atuais e diga o que deseja ajustar.', showCart: true });
      return;
    }
    if (previous.type === 'coupon') {
      if (previous.code && !this.couponCatalog.find(previous.code)) {
        this.append({ role: 'assistant', text: 'O cupom anterior não está mais disponível. Mantive o cupom atual; você pode escolher outro entre os cupons de hoje.', showCoupons: true });
        return;
      }
      if (previous.code) this.cart.applyCoupon(previous.code);
      else this.cart.removeCoupon();
    } else if (previous.type === 'selection') {
      for (const item of previous.items) {
        const exists = this.cartItems().some(entry => entry.product.id === item.product.id);
        if (item.quantity === 0) this.cart.removeCartItem(item.product);
        else if (exists) this.cart.setItemQuantity(item.product.id, item.quantity);
        else this.cart.addCartItem(item.product, item.quantity);
        if (item.quantity > 0) this.cart.setProductSelected(item.product.id, item.selected);
      }
      this.messages.update(messages => messages.map(message => message.id === previous.messageId && message.shoppingPlan
        ? { ...message, shoppingPlan: { ...message.shoppingPlan, applied: false } } : message));
    } else {
      const exists = this.cartItems().some((item) => item.product.id === previous.product.id);
      if (previous.quantity === 0) this.cart.removeCartItem(previous.product);
      else if (exists) this.cart.setItemQuantity(previous.product.id, previous.quantity);
      else this.cart.addCartItem(previous.product, previous.quantity);
      if (previous.quantity > 0) this.cart.setProductSelected(previous.product.id, previous.selected);
    }
    this.append({ role: 'assistant', text: 'Desfiz minha última alteração. Confira o carrinho atualizado:', showCart: true,
      link: { label: 'Ver carrinho', path: '/cart' } });
  }

  private actOnProduct(product: ProductModel, action: ProductAction, quantity: number): void {
    this.pendingProductAction = undefined;
    this.pendingQuestion = undefined;
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
    const previousItem = { type: 'item' as const, product: item?.product ?? product,
      quantity: item?.quantity ?? 0, selected: this.cart.isProductSelected(product.id) };
    const replyOptions = [{ label: 'Desfazer', prompt: 'Desfazer última alteração' }];

    if (action === 'add') {
      if ((item?.quantity ?? 0) + quantity > 99) {
        this.append({
          role: 'assistant',
          text: 'O limite é de 99 unidades por produto no carrinho.',
        });
        return;
      }
      this.cart.addCartItem(product, quantity);
      this.cartUndo = { ...previousItem, expectedState: this.cartFingerprint() };
      this.append({
        role: 'assistant',
        text: `${quantity} ${quantity === 1 ? 'unidade adicionada' : 'unidades adicionadas'}: ${product.title}. Agora seu carrinho tem ${this.cartCount()} ${this.cartCount() === 1 ? 'item' : 'itens'}.`,
        replyOptions,
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
      this.cartUndo = { ...previousItem, expectedState: this.cartFingerprint() };
      this.append({
        role: 'assistant',
        text: `${product.title} foi removido do carrinho.`,
        replyOptions,
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
    if (nextQuantity !== previousItem.quantity) this.cartUndo = { ...previousItem, expectedState: this.cartFingerprint() };
    this.append({
      role: 'assistant',
      text: `Quantidade de ${product.title} atualizada para ${nextQuantity}.`,
      replyOptions: nextQuantity !== previousItem.quantity ? replyOptions : undefined,
      link: { label: 'Ver carrinho', path: '/cart' },
    });
  }

  private append(message: Omit<ChatMessage, 'id'>): void {
    if (message.role === 'assistant' && message.products?.length) {
      const products = message.products;
      if (!message.preserveResultContext || !products.every((product) => this.lastResults.some((entry) => entry.id === product.id))) {
        this.lastResults = products;
      }
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
    this.saveSession([...this.messages().slice(-39), { ...message, id }]);
    const reducedMotion = this.document.defaultView?.matchMedia?.(
      '(prefers-reduced-motion: reduce)',
    ).matches;
    if (message.role === 'assistant' && this.browser && !reducedMotion) {
      this.completedReply = { ...message, id };
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
          this.completedReply = undefined;
          this.scheduleNextTask();
        } else {
          this.typingTimer = setTimeout(typeNext, 24);
        }
      };
      this.typingTimer = setTimeout(typeNext, 500);
      return;
    }
    this.messages.update((current) => [...current.slice(-39), { ...message, id }]);
    this.scrollToLatest();
    if (message.role === 'assistant') this.scheduleNextTask();
  }

  private scrollToLatest(): void {
    clearTimeout(this.scrollTimer);
    this.scrollTimer = setTimeout(() => {
      const list = this.messageList?.nativeElement;
      if (list && this.followMessages) list.scrollTop = list.scrollHeight;
      else if (list) this.hasNewMessages.set(true);
    });
  }
}
