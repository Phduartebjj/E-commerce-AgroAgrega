import { Component, inject, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';

import { Cart } from '../../core/services/cart/cart.service';
import { ProductService } from '../../core/services/product/product.service';
import { ProductCategory, ProductModel } from '../../models/product';
import { PrecoFormatadoPipe } from '../../shared/pipes/preco-formatado-pipe';

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
  mode: 'main' | 'detail' | 'context' | 'specification';
}

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
  imports: [PrecoFormatadoPipe, RouterLink, FormsModule],
  templateUrl: './product-details.html',
  styleUrl: './product-details.css',
})
export class ProductDetails implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly productService = inject(ProductService);
  private readonly cart = inject(Cart);

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
  activeTab: 'details' | 'reviews' = 'details';
  reviews: ProductReview[] = [];
  questions: ProductQuestion[] = [];
  selectedRating = 0;
  reviewText = '';
  questionText = '';
  questionFeedback = '';

  ngOnInit(): void {
    this.route.paramMap.subscribe((params) => {
      this.id = params.get('id');
      this.product = this.productService
        .getProducts()()
        .find((product) => product.id === this.id);
      this.quantity = 1;
      this.selectedImageIndex = 0;
      this.imageUnavailable = false;
      this.zoomOpen = false;
      this.questionText = '';
      this.questionFeedback = '';
      this.loadProductExperience();
    });
  }

  get productNotFound(): boolean {
    return this.product === undefined;
  }

  get galleryViews(): GalleryView[] {
    if (!this.product || this.product.images.length === 0) return [];

    if (this.product.images.length > 1) {
      return this.product.images.map((src, index) => ({
        src,
        label: `Imagem ${index + 1}`,
        mode: index === 0 ? 'main' : 'detail',
      }));
    }

    const src = this.product.images[0];
    return [
      { src, label: 'Vista principal', mode: 'main' },
      { src, label: 'Detalhe ampliado', mode: 'detail' },
      { src, label: 'Uso no campo', mode: 'context' },
      { src, label: 'Ficha visual', mode: 'specification' },
    ];
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

  selectTab(tab: 'details' | 'reviews'): void {
    this.activeTab = tab;
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
    this.zoomOpen = true;
  }

  closeZoom(): void {
    this.zoomOpen = false;
  }

  handleImageError(): void {
    this.imageUnavailable = true;
  }

  increaseQuantity(): void {
    this.quantity += 1;
  }

  decreaseQuantity(): void {
    if (this.quantity > 1) this.quantity -= 1;
  }

  addToCart(): void {
    if (!this.product || this.quantity <= 0) return;
    this.cart.addCartItem(this.product, this.quantity);
    this.showCartNotification();
  }

  addRelatedProduct(product: ProductModel): void {
    this.cart.addCartItem(product);
    this.showCartNotification();
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
    if (!question) return;

    this.questions.unshift({
      question,
      answer: 'Recebemos sua pergunta. Um especialista AgroAgrega responderá em breve.',
    });
    this.questionText = '';
    this.questionFeedback = 'Pergunta enviada com sucesso.';
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
    if (!this.product) return 0;

    const ratios =
      this.product.rating >= 4.8
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

    this.baseReviewCount = Math.max(18, (this.product.weeklySales ?? 12) * 4);
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

    this.questions = [
      {
        question: 'Para qual tipo de uso este produto é indicado?',
        answer: `É indicado para ${this.categoryProfile.application}. Confira também as orientações técnicas antes do uso.`,
      },
      {
        question: 'Como conservar o produto depois da compra?',
        answer: this.categoryProfile.care,
      },
    ];
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
