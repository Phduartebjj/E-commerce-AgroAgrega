import { ChangeDetectorRef, Component, DestroyRef, HostListener, inject, OnInit } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Subscription } from 'rxjs';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';

import { Cart } from '../../core/services/cart/cart.service';
import { ProductService } from '../../core/services/product/product.service';
import { ProductCategory, ProductModel } from '../../models/product';
import { getPartnerStoreLogo } from '../../shared/constants/partner-stores';
import {
  calculateDiscountPercent,
  calculatePixPrice,
  getFreeDeliveryLabel,
  getWeeklySalesLabel,
} from '../../shared/utils/product-card-display';
import { ShippingService } from '../../core/services/shipping/shipping.service';
import { ShippingQuote } from '../../models/shipping';

interface ProductReview {
  author: string;
  stars: number;
  text: string;
  createdAt: string;
  verified: boolean;
}

interface ProductQuestion {
  question: string;
  answer: string;
}

interface ProductSpecification {
  label: string;
  value: string;
}

interface GalleryView {
  src: string;
  label: string;
}

type ProductSection = 'description' | 'specifications' | 'benefits' | 'application' | 'reviews' | 'questions';
type ProductModal = 'shipping' | 'payments' | 'reviews' | 'support' | 'tracking' | 'presentation';

// Presentation supplied for this catalog entry; keep these values together so the
// product card, purchase amount and reference layout cannot drift apart locally.
const REFERENCE_PRODUCT = {
  id: 'agro-040',
  price: 112.43,
  originalPrice: 128.9,
  rating: 4.6,
  reviewCount: 328,
  brand: 'Nutrifoliar',
  sku: '789456123789',
  installments: 3,
  summary: 'Nutrição foliar balanceada para o desenvolvimento vegetativo e reprodutivo das culturas. Indicado para manejo agrícola.',
  description: 'Nutrição foliar balanceada para apoiar o desenvolvimento vegetativo e reprodutivo das culturas. Este item foi selecionado para oferecer mais produtividade e qualidade no campo, com micronutrientes essenciais que auxiliam na absorção dos nutrientes e no fortalecimento das plantas.',
  indication: 'Soja, Milho, Algodão, Café, Citros e outras culturas.',
  benefits: ['Desenvolvimento mais uniforme', 'Maior produtividade', 'Absorção eficiente', 'Resultados comprovados'],
  specifications: [
    { label: 'Marca', value: 'Nutrifoliar' },
    { label: 'Apresentação', value: '5 L' },
    { label: 'Categoria', value: 'Fertilizantes Foliares' },
    { label: 'Concentração', value: 'Completo com Micronutrientes' },
    { label: 'Aplicação', value: 'Via foliar' },
    { label: 'Indicação', value: 'Uso agrícola' },
    { label: 'Registro MAPA', value: 'Sim' },
    { label: 'Código do produto', value: 'NF-5000' },
  ],
  applicationSteps: [
    { title: 'Diluição', text: 'Seguir a recomendação do fabricante.' },
    { title: 'Aplicação', text: 'Realizar via foliar, em horário adequado.' },
    { title: 'Frequência', text: 'Conforme o manejo da cultura.' },
  ],
};

interface CategoryDetailProfile {
  application: string;
  benefit: string;
  care: string;
  support: string;
}

const CATEGORY_DETAILS: Record<ProductCategory, CategoryDetailProfile> = {
  'Agricultura de Precisão': {
    application: 'monitoramento, planejamento e tomada de decisão no campo',
    benefit: 'mais controle das operações e informações para um manejo preciso',
    care: 'Mantenha o equipamento protegido de impactos e siga o manual de instalação e calibração.',
    support: 'Orientação de configuração e uso disponível pelos canais AgroAgrega.',
  },
  Irrigação: {
    application: 'implantação, automação e manutenção de sistemas de irrigação',
    benefit: 'distribuição de água mais organizada e eficiente na rotina rural',
    care: 'Verifique pressão, conexões e limpeza periódica antes de colocar o sistema em operação.',
    support: 'Suporte para conferir aplicação, instalação e compatibilidade do sistema.',
  },
  Pecuária: {
    application: 'manejo, organização e bem-estar na produção pecuária',
    benefit: 'mais praticidade nas tarefas diárias e melhor controle da operação',
    care: 'Realize higienização e inspeções periódicas conforme a frequência de uso.',
    support: 'Atendimento para orientar o uso seguro na rotina da propriedade.',
  },
  Insumos: {
    application: 'manejo agrícola e suporte ao desenvolvimento das culturas',
    benefit: 'aplicação planejada e maior consistência no manejo da lavoura',
    care: 'Armazene em local seco, ventilado e protegido do sol, mantendo a embalagem fechada.',
    support: 'Consulte sempre as orientações da embalagem e a recomendação técnica da sua região.',
  },
  Ferramentas: {
    application: 'manutenção, preparo e tarefas operacionais no campo',
    benefit: 'mais agilidade e segurança para executar serviços do dia a dia',
    care: 'Limpe após o uso e guarde em local seco, respeitando as orientações de segurança.',
    support: 'Suporte AgroAgrega para dúvidas de uso e conservação do produto.',
  },
};

@Component({
  selector: 'app-product-details',
  imports: [RouterLink, FormsModule],
  templateUrl: './product-details.html',
  styleUrls: ['./product-details.css', './product-details-actions.css', './product-details-discovery.css'],
})
export class ProductDetails implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly productService = inject(ProductService);
  private readonly cart = inject(Cart);
  private readonly shipping = inject(ShippingService);
  private readonly changeDetector = inject(ChangeDetectorRef);
  private readonly destroyRef = inject(DestroyRef);
  private dialogTrigger: HTMLElement | null = null;
  private shippingRequest = 0;
  private shippingSubscription: Subscription | null = null;

  cartNotifications: number[] = [];
  private notificationId = 0;
  private baseReviewCount = 0;
  private submittedReviewCount = 0;

  id: string | null = null;
  product: ProductModel | undefined;
  quantity = 1;
  selectedImageIndex = 0;
  imageUnavailable = false;
  zoomOpen = false;
  activeSection: ProductSection = 'description';
  reviews: ProductReview[] = [];
  questions: ProductQuestion[] = [];
  selectedRating = 0;
  reviewText = '';
  questionText = '';
  questionFeedback = '';
  followingStore = false;
  modal: ProductModal | null = null;
  presentationPlaying = true;
  showAllImages = false;
  openQuestionIndex: number | null = null;
  shippingCep = '';
  shippingLoading = false;
  shippingError = '';
  shippingResult: ShippingQuote | null = null;
  readonly calculateRelatedDiscount = calculateDiscountPercent;
  readonly calculateRelatedPixPrice = calculatePixPrice;
  readonly getRelatedSalesLabel = getWeeklySalesLabel;
  readonly relatedDeliveryLabel = getFreeDeliveryLabel();

  ngOnInit(): void {
    this.route.paramMap.subscribe((params) => {
      const nextId = params.get('id');
      if (nextId === this.id && this.product) return;
      this.id = nextId;
      this.product = this.productService
        .getProducts()()
        .find((product) => product.id === this.id);
      this.quantity = 1;
      this.selectedImageIndex = 0;
      this.imageUnavailable = false;
      this.zoomOpen = false;
      this.activeSection = 'description';
      this.questionText = '';
      this.questionFeedback = '';
      this.followingStore = false;
      this.modal = null;
      this.showAllImages = false;
      this.openQuestionIndex = null;
      this.invalidateShipping();
      this.loadProductExperience();
      this.changeDetector.markForCheck();
    });
  }

  get productNotFound(): boolean {
    return this.product === undefined;
  }

  get isReferenceProduct(): boolean { return this.product?.id === REFERENCE_PRODUCT.id; }
  get displayBrand(): string { return this.isReferenceProduct ? REFERENCE_PRODUCT.brand : this.brandLabel; }
  get displaySku(): string { return this.isReferenceProduct ? REFERENCE_PRODUCT.sku : this.product?.id ?? ''; }
  get displayCategory(): string { return this.isReferenceProduct ? 'Fertilizantes' : this.product?.category ?? ''; }
  get displaySubcategory(): string { return this.isReferenceProduct ? 'Foliares' : ''; }
  get displaySummary(): string { return this.isReferenceProduct ? REFERENCE_PRODUCT.summary : this.product?.description ?? ''; }
  get displayOriginalPrice(): number | undefined { return this.product?.originalPrice; }
  get displayInstallments(): number { return this.isReferenceProduct ? REFERENCE_PRODUCT.installments : 10; }
  get displayInstallmentValue(): number { return (this.product?.price ?? 0) / this.displayInstallments; }
  get displayDescription(): string { return this.isReferenceProduct ? REFERENCE_PRODUCT.description : this.productDescriptionParagraphs.join(' '); }
  get displayIndication(): string { return this.isReferenceProduct ? REFERENCE_PRODUCT.indication : this.categoryProfile.application; }
  get displayBenefits(): string[] { return this.isReferenceProduct ? REFERENCE_PRODUCT.benefits : ['Praticidade no campo', 'Manejo organizado', 'Uso eficiente', 'Suporte especializado']; }
  get displaySpecifications(): ProductSpecification[] { return this.isReferenceProduct ? REFERENCE_PRODUCT.specifications : this.productSpecifications; }
  get displayApplicationSteps(): { title: string; text: string }[] {
    return this.isReferenceProduct ? REFERENCE_PRODUCT.applicationSteps : [
      { title: 'Preparação', text: 'Leia as instruções do fabricante antes do uso.' },
      { title: 'Aplicação', text: 'Utilize conforme o manual e a indicação do produto.' },
      { title: 'Conservação', text: this.categoryProfile.care },
    ];
  }
  get displayReviewCount(): number { return this.reviewCount; }

  formatMoney(value: number): string {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  }

  openModal(kind: ProductModal): void {
    this.rememberDialogTrigger();
    this.zoomOpen = false;
    this.modal = kind;
    this.presentationPlaying = true;
    this.focusDialog();
  }

  closeModal(): void {
    this.modal = null;
    this.presentationPlaying = false;
    this.dialogTrigger?.focus();
  }

  toggleGallery(): void { this.showAllImages = !this.showAllImages; }

  toggleQuestion(index: number): void {
    if (index < 0 || index >= this.questions.length) return;
    this.openQuestionIndex = this.openQuestionIndex === index ? null : index;
  }

  calculateShipping(): void {
    const cep = this.shippingCep.replace(/\D/g, '');
    this.invalidateShipping();
    const request = this.shippingRequest;
    if (!/^\d{8}$/.test(cep)) {
      this.shippingLoading = false;
      this.shippingError = 'Informe um CEP válido com 8 dígitos.';
      return;
    }
    if (!this.product) return;
    this.shippingLoading = true;
    this.shippingSubscription = this.shipping.quote(this.product, this.quantity, cep)
      .pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (quote) => {
        if (request !== this.shippingRequest) return;
        this.shippingLoading = false;
        this.shippingCep = `${cep.slice(0, 5)}-${cep.slice(5)}`;
        this.shippingResult = quote;
        this.changeDetector.markForCheck();
      },
      error: (error: Error) => {
        if (request !== this.shippingRequest) return;
        this.shippingLoading = false;
        this.shippingError = error.message || 'Não foi possível calcular o frete agora. Tente novamente.';
        this.changeDetector.markForCheck();
      },
    });
  }

  invalidateShipping(): void {
    this.shippingRequest += 1;
    this.shippingSubscription?.unsubscribe();
    this.shippingSubscription = null;
    this.shippingLoading = false;
    this.shippingError = '';
    this.shippingResult = null;
    this.changeDetector.markForCheck();
  }

  @HostListener('document:keydown', ['$event'])
  onDialogKeydown(event: KeyboardEvent): void {
    if (!this.modal && !this.zoomOpen) return;
    if (event.key === 'Escape') {
      event.preventDefault();
      if (this.zoomOpen) this.closeZoom(); else this.closeModal();
      return;
    }
    if (event.key !== 'Tab' || typeof document === 'undefined') return;
    const elements = Array.from(document.querySelectorAll<HTMLElement>('.modal-backdrop .dialog button:not([disabled]), .modal-backdrop .dialog a[href], .modal-backdrop .dialog input, .modal-backdrop .dialog textarea')).filter((element) => element.getClientRects().length > 0);
    const first = elements[0];
    const last = elements[elements.length - 1];
    if (!first) return;
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
    else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
  }

  private rememberDialogTrigger(): void {
    if (typeof document !== 'undefined') this.dialogTrigger = document.activeElement as HTMLElement;
  }

  private focusDialog(): void {
    if (typeof document !== 'undefined') setTimeout(() => document.querySelector<HTMLElement>('.modal-backdrop .dialog .modal-close')?.focus(), 0);
  }

  get galleryViews(): GalleryView[] {
    if (!this.product || this.product.images.length === 0) return [];
    return [...new Set(this.product.images)].map((src, index) => ({
      src,
      label: index === 0 ? 'Foto principal' : `Outro ângulo ${index}`,
    }));
  }

  get selectedGalleryView(): GalleryView | undefined {
    return this.galleryViews[this.selectedImageIndex];
  }

  get selectedImage(): string | undefined {
    return this.selectedGalleryView?.src;
  }

  get categoryProfile(): CategoryDetailProfile {
    return CATEGORY_DETAILS[this.product?.category ?? 'Insumos'];
  }

  get productHighlights(): string[] {
    if (!this.product) return [];

    return [
      this.product.description,
      `Indicado para ${this.categoryProfile.application}.`,
      `Desenvolvido para oferecer ${this.categoryProfile.benefit}.`,
      'Compra protegida, pedido acompanhado e atendimento pelos canais AgroAgrega.',
    ];
  }

  get productSpecifications(): ProductSpecification[] {
    if (!this.product) return [];

    return [
      { label: 'Marca', value: this.brandLabel },
      { label: 'Categoria', value: this.product.category },
      { label: 'Apresentação', value: this.productMeasure },
      { label: 'Aplicação', value: this.categoryProfile.application },
      { label: 'Condição', value: 'Produto novo' },
      { label: 'Disponibilidade', value: 'Pronta entrega' },
      { label: 'Código do produto', value: this.product.id },
      { label: 'Atendimento', value: this.categoryProfile.support },
    ];
  }

  get productDescriptionParagraphs(): string[] {
    if (!this.product) return [];

    return [
      this.product.description,
      `Este item foi selecionado para apoiar ${this.categoryProfile.application}, reunindo praticidade e uma solução adequada à rotina da propriedade.`,
      `Para preservar o desempenho e a vida útil, ${this.categoryProfile.care.charAt(0).toLocaleLowerCase('pt-BR')}${this.categoryProfile.care.slice(1)}`,
    ];
  }

  get brandLabel(): string {
    const brand = this.product?.brand;
    return brand && brand !== 'none' ? brand : 'Seleção AgroAgrega';
  }

  get sellerName(): string {
    return `${this.brandLabel} • Loja parceira`;
  }

  get sellerLogo(): string {
    return getPartnerStoreLogo(this.product?.brand);
  }

  get sellerFollowers(): string {
    const seed = [...this.brandLabel].reduce(
      (total, character) => total + character.charCodeAt(0),
      0,
    );
    return `+${(seed % 32) + 8},${seed % 10} mil`;
  }

  get sellerCatalogSize(): number {
    if (!this.product) return 0;
    return this.productService
      .getProducts()()
      .filter((item) => item.brand === this.product?.brand).length;
  }

  get sellerRating(): string {
    const products = this.productService.getProducts()()
      .filter((item) => item.brand === this.product?.brand);
    const average = products.length
      ? products.reduce((total, item) => total + item.rating, 0) / products.length
      : this.product?.rating ?? 0;
    return average.toFixed(1).replace('.', ',');
  }

  get productMeasure(): string {
    const match = this.product?.title.match(
      /\d+(?:[,.]\d+)?\s?(?:kg|g|l|ml|m²|m|cm|mm|w|v|cv|cc|peças|unidades|doses|setores|plantas|polegadas)/i,
    );
    return match?.[0] ?? '1 unidade';
  }

  get installmentValue(): number {
    return (this.product?.price ?? 0) / 10;
  }

  get discountPercent(): number {
    if (!this.product?.originalPrice || this.product.originalPrice <= this.product.price) return 0;
    return Math.round((1 - this.product.price / this.product.originalPrice) * 100);
  }

  get soldCount(): number {
    return Math.max(24, (this.product?.weeklySales ?? 12) * 6);
  }

  get stockQuantity(): number {
    const seed = [...(this.product?.id ?? '')].reduce(
      (total, character) => total + character.charCodeAt(0),
      0,
    );
    return (seed % 38) + 12;
  }

  get relatedProducts(): ProductModel[] {
    if (!this.product) return [];
    return this.productService
      .getProducts()()
      .filter((item) => item.id !== this.product?.id && item.category === this.product?.category)
      .sort((first, second) => (second.weeklySales ?? 0) - (first.weeklySales ?? 0))
      .slice(0, 4);
  }

  get sidebarRelatedProducts(): ProductModel[] {
    return this.relatedProducts;
  }

  selectSection(section: ProductSection): void {
    this.activeSection = section;
    setTimeout(() => document.getElementById(section)?.scrollIntoView({ behavior: 'smooth' }), 0);
  }

  selectImage(index: number): void {
    if (index < 0 || index >= this.galleryViews.length) return;
    this.selectedImageIndex = index;
    this.imageUnavailable = false;
  }

  nextImage(): void {
    if (this.galleryViews.length === 0) return;
    this.selectedImageIndex = (this.selectedImageIndex + 1) % this.galleryViews.length;
    this.imageUnavailable = false;
  }

  previousImage(): void {
    if (this.galleryViews.length === 0) return;
    this.selectedImageIndex =
      (this.selectedImageIndex - 1 + this.galleryViews.length) % this.galleryViews.length;
    this.imageUnavailable = false;
  }

  openZoom(): void {
    if (!this.selectedImage || this.imageUnavailable) return;
    this.rememberDialogTrigger();
    this.modal = null;
    this.zoomOpen = true;
    this.focusDialog();
  }

  closeZoom(): void {
    this.zoomOpen = false;
    this.dialogTrigger?.focus();
  }

  handleImageError(): void {
    this.imageUnavailable = true;
  }

  increaseQuantity(): void {
    this.quantity += 1;
    this.invalidateShipping();
  }

  decreaseQuantity(): void {
    if (this.quantity > 1) {
      this.quantity -= 1;
      this.invalidateShipping();
    }
  }

  addToCart(): void {
    if (!this.product || this.quantity <= 0) return;
    this.cart.addCartItem(this.product, this.quantity);
    this.showCartNotification();
  }

  toggleStoreFollow(): void {
    this.followingStore = !this.followingStore;
  }

  selectRating(rating: number): void {
    if (rating < 1 || rating > 5) return;
    this.selectedRating = rating;
  }

  submitReview(): void {
    const text = this.reviewText.trim();
    if (!this.product || this.selectedRating < 1 || !text) return;

    const review: ProductReview = {
      author: 'Cliente AgroAgrega',
      stars: this.selectedRating,
      text,
      createdAt: new Date().toLocaleDateString('pt-BR'),
      verified: false,
    };

    this.reviews.unshift(review);
    this.submittedReviewCount += 1;
    this.productService.addReview(this.product.id, review);
    this.selectedRating = 0;
    this.reviewText = '';
  }

  submitQuestion(): void {
    const question = this.questionText.trim();
    if (!this.product || !question || question.length > 300) return;

    const entry = {
      question,
      answer: 'Pergunta salva neste navegador. Para obter uma orientação técnica, fale com o suporte especializado ou consulte o fabricante.',
    };
    this.questions.unshift(entry);
    this.openQuestionIndex = 0;
    try {
      const saved = this.readSavedQuestions();
      localStorage.setItem(this.questionStorageKey, JSON.stringify([entry, ...saved].slice(0, 30)));
      this.questionFeedback = 'Pergunta salva neste navegador.';
    } catch {
      this.questionFeedback = 'Pergunta adicionada nesta sessão. O navegador não permitiu salvá-la.';
    }
    this.questionText = '';
  }

  get reviewAverage(): number {
    if (!this.product) return 0;
    if (this.submittedReviewCount === 0) return this.product.rating;

    const submittedTotal = this.reviews
      .slice(0, this.submittedReviewCount)
      .reduce((total, review) => total + review.stars, 0);
    return (this.product.rating * this.baseReviewCount + submittedTotal) / this.reviewCount;
  }

  get reviewCount(): number {
    return this.baseReviewCount + this.submittedReviewCount;
  }

  getRatingCount(stars: number): number {
    if (!this.product || stars < 1 || stars > 5) return 0;

    const ratios =
      this.isReferenceProduct ? [0.01, 0.02, 0.07, 0.18, 0.72] : this.product.rating >= 4.8
        ? [0.01, 0.01, 0.03, 0.11, 0.84]
        : this.product.rating >= 4.5
          ? [0.01, 0.02, 0.06, 0.19, 0.72]
          : [0.02, 0.05, 0.1, 0.25, 0.58];
    const submittedAtRating = this.reviews
      .slice(0, this.submittedReviewCount)
      .filter((review) => review.stars === stars).length;

    return Math.round(this.baseReviewCount * ratios[stars - 1]) + submittedAtRating;
  }

  getRatingPercentage(stars: number): number {
    return this.reviewCount === 0 ? 0 : (this.getRatingCount(stars) / this.reviewCount) * 100;
  }

  private loadProductExperience(): void {
    if (!this.product) {
      this.reviews = [];
      this.questions = [];
      return;
    }

    this.baseReviewCount = this.isReferenceProduct ? REFERENCE_PRODUCT.reviewCount : Math.max(18, (this.product.weeklySales ?? 12) * 4);
    this.submittedReviewCount = 0;

    this.reviews = this.product.reviews?.length
      ? this.product.reviews.map((review) => ({
          author: review.author ?? 'Cliente AgroAgrega',
          stars: review.stars,
          text: review.text,
          createdAt: review.createdAt ?? 'Compra recente',
          verified: true,
        }))
      : [
          {
            author: 'Marina S.',
            stars: Math.max(4, Math.round(this.product.rating)),
            text: 'Produto bem apresentado, chegou protegido e atendeu ao uso informado no anúncio.',
            createdAt: 'Há 2 semanas',
            verified: true,
          },
          {
            author: 'Carlos R.',
            stars: Math.max(4, Math.floor(this.product.rating)),
            text: 'Boa experiência de compra. As informações ajudaram a escolher a opção certa para a propriedade.',
            createdAt: 'Há 1 mês',
            verified: true,
          },
        ];

    const commonQuestions = this.isReferenceProduct ? [
      {
        question: 'Qual a dosagem recomendada para soja?',
        answer: 'A dose depende do estágio da cultura e das condições da lavoura. Consulte o rótulo do fabricante e a recomendação de um profissional habilitado antes da aplicação.',
      },
      {
        question: 'Pode ser aplicado com outros defensivos?',
        answer: 'A compatibilidade deve ser confirmada pelo fabricante e pelo responsável técnico. Não misture produtos sem verificar as orientações dos respectivos rótulos.',
      },
      {
        question: 'Tem indicação para milho?',
        answer: 'O milho está entre as culturas indicadas nesta apresentação. Confira no rótulo a dose e a época de aplicação adequadas, com orientação técnica.',
      },
    ] : [
      {
        question: 'Para qual tipo de uso este produto é indicado?',
        answer: `É indicado para ${this.categoryProfile.application}. Confira também as orientações técnicas antes do uso.`,
      },
      {
        question: 'Como conservar o produto depois da compra?',
        answer: this.categoryProfile.care,
      },
    ];
    this.questions = [...this.readSavedQuestions(), ...commonQuestions];
  }

  private get questionStorageKey(): string {
    return `agroagrega-product-questions:${this.product?.id ?? ''}`;
  }

  private readSavedQuestions(): ProductQuestion[] {
    try {
      const saved: unknown = JSON.parse(localStorage.getItem(this.questionStorageKey) ?? '[]');
      if (!Array.isArray(saved)) return [];
      return saved.filter((entry): entry is ProductQuestion => typeof entry?.question === 'string' && typeof entry?.answer === 'string').slice(0, 30);
    } catch {
      return [];
    }
  }

  private showCartNotification(): void {
    const notificationId = ++this.notificationId;
    this.cartNotifications.push(notificationId);

    if (this.cartNotifications.length > 3) this.cartNotifications.shift();

    setTimeout(() => {
      this.cartNotifications = this.cartNotifications.filter((id) => id !== notificationId);
    }, 3000);
  }
}
