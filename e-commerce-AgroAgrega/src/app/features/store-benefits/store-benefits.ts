import { isPlatformBrowser } from '@angular/common';
import { Component, inject, PLATFORM_ID, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';

import { COUPONS } from '@core/data/coupons';
import { Auth } from '@core/services/auth/auth.service';
import { Cart } from '@core/services/cart/cart.service';
import { CouponModel } from '@models/coupon';
import { StoreAssistantState } from '../../shared/components/store-assistant/store-assistant-state';
import { CouponShowcaseStylesComponent } from './coupon-showcase-styles';

type StoreBenefitMode = 'coupons' | 'agroPlus';
type AgroPlusBenefitCategory = 'economy' | 'exclusive' | 'shipping' | 'points';
type CouponFilter =
  'all' | 'first-order' | 'inputs' | 'tools' | 'irrigation' | 'livestock' | 'expiring';
type CouponSort = 'relevance' | 'discount' | 'code';

interface AgroPlusBenefit {
  id: string;
  category: AgroPlusBenefitCategory;
  icon: string;
  label: string;
  title: string;
  summary: string;
  detail: string;
  stat: string;
}

@Component({
  selector: 'app-store-benefits',
  imports: [RouterLink, CouponShowcaseStylesComponent],
  templateUrl: './store-benefits.html',
  styleUrls: ['./store-benefits-visuals.css', './store-benefits.css', './agro-plus-showcase.css'],
})
export class StoreBenefitsComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly cart = inject(Cart);
  readonly auth = inject(Auth);
  readonly assistant = inject(StoreAssistantState);
  private readonly platformId = inject(PLATFORM_ID);

  readonly mode = (this.route.snapshot.data['storeBenefitMode'] ?? 'coupons') as StoreBenefitMode;
  readonly coupons = COUPONS;
  readonly agroPlusCoupon = COUPONS.find((coupon) => coupon.code === 'AGRO20')!;
  readonly agroPlusActive = signal(false);
  readonly feedbackMessage = signal('');
  readonly selectedCouponFilter = signal<CouponFilter>('all');
  readonly couponSearch = signal('');
  readonly couponSort = signal<CouponSort>('relevance');
  readonly expandedCouponCode = signal<string | null>(null);
  readonly couponFilters: Array<{ id: CouponFilter; label: string; icon: string }> = [
    { id: 'all', label: 'Todos os cupons', icon: '▦' },
    { id: 'first-order', label: 'Primeira compra', icon: '♙' },
    { id: 'inputs', label: 'Insumos', icon: '⌁' },
    { id: 'tools', label: 'Ferramentas', icon: '⌕' },
    { id: 'irrigation', label: 'Irrigação', icon: '◉' },
    { id: 'livestock', label: 'Pecuária', icon: '♧' },
    { id: 'expiring', label: 'Expirando em breve', icon: '◷' },
  ];
  readonly selectedBenefitId = signal('cashback');
  readonly benefitDetailsOpen = signal(false);
  readonly benefitIcons: Record<string, string> = {
    cashback:
      'M8 4h16l4 5v15l-4 4H8l-4-4V9ZM11 21l10-10M12 10a2 2 0 1 0 0 4 2 2 0 0 0 0-4ZM20 18a2 2 0 1 0 0 4 2 2 0 0 0 0-4Z',
    points:
      'M14 8c0-3 14-3 14 0s-14 3-14 0ZM14 8v6c0 3 14 3 14 0V8M18 18c5 1 10-1 10-3M28 14v6c0 2-5 3-9 3M3 17c0-3 14-3 14 0s-14 3-14 0ZM3 17v6c0 3 14 3 14 0v-6M3 23v5c0 3 14 3 14 0v-5',
    shipping:
      'M3 7h16v17H3ZM19 13h6l5 6v5H19M8 21a4 4 0 1 0 0 8 4 4 0 0 0 0-8ZM24 21a4 4 0 1 0 0 8 4 4 0 0 0 0-8Z',
    'early-access': 'M5 12h7L25 6v20l-13-6H5ZM8 20l3 9h5l-3-9M28 11l2 2v6l-2 2',
    discount: 'M3 4h13l14 14-12 12L3 15ZM9 9a2 2 0 1 0 0 4 2 2 0 0 0 0-4Z',
    partners:
      'm2 15 5-9 7 2 4-2 7 2 5 8-6 9-4 3-4-2-4 1-5-5Zm9 0 6-6 5 3M11 15l3 2 5-4M11 21l6 5M15 18l8 6M21 17l5 4',
    content: 'M16 8C12 4 5 4 2 6v21c5-2 10-2 14 1 4-3 9-3 14-1V6c-3-2-10-2-14 2ZM16 8v20',
    support:
      'M5 18v-5a11 11 0 0 1 22 0v10c0 5-3 6-8 6M5 15H2v10h6V15ZM27 15h3v10h-6V15ZM15 27h5v4h-5Z',
    economy: 'm16 2 11 5v8c0 7-11 14-11 14S5 22 5 15V7ZM10 15l4 4 8-9',
    exclusive: 'm16 2 11 5v8c0 7-11 14-11 14S5 22 5 15V7Z',
  };
  readonly selectedBenefitCategory = signal<'all' | AgroPlusBenefitCategory>('all');
  readonly monthlyPurchaseValue = signal(500);
  readonly subscriptionPrice = 20.9;
  readonly benefitFilters: Array<{
    id: 'all' | AgroPlusBenefitCategory;
    label: string;
    icon?: string;
  }> = [
    { id: 'all', label: 'Todos' },
    { id: 'economy', label: 'Economia', icon: 'economy' },
    { id: 'shipping', label: 'Frete', icon: 'shipping' },
    { id: 'exclusive', label: 'Exclusividades', icon: 'exclusive' },
    { id: 'points', label: 'Agropontos', icon: 'discount' },
  ];
  readonly agroPlusBenefits: AgroPlusBenefit[] = [
    {
      id: 'cashback',
      category: 'economy',
      icon: '%',
      label: 'Benefício principal',
      title: '20% de volta em cashback',
      summary:
        'Receba 20% do valor das suas primeiras compras em crédito AgroAgrega e use nas próximas compras.',
      detail:
        'Nas compras iniciais elegíveis, você recebe 20% do valor em crédito AgroAgrega. O saldo pode reduzir o custo dos próximos insumos e equipamentos, conforme as condições da campanha.',
      stat: '20% de volta',
    },
    {
      id: 'points',
      category: 'points',
      icon: '2x',
      label: 'Cada compra vale mais',
      title: '2x mais Agropontos',
      summary: 'Acumule o dobro de pontos em suas compras e troque por descontos exclusivos.',
      detail:
        'Produtos e campanhas participantes rendem pontos em dobro para membros Agro+. Eles podem ser trocados por cupons e vantagens dentro da loja, conforme a elegibilidade de cada campanha.',
      stat: '2x mais Agropontos',
    },
    {
      id: 'shipping',
      category: 'shipping',
      icon: 'frete',
      label: 'Mais economia',
      title: 'Frete grátis em compras elegíveis',
      summary: 'Economize no frete e receba seus produtos com mais vantagens.',
      detail:
        'Pedidos elegíveis acima de R$ 399 recebem frete padrão grátis nas regiões atendidas pela campanha. Confira a condição no carrinho antes de concluir a compra.',
      stat: 'Frete R$ 0',
    },
    {
      id: 'early-access',
      category: 'exclusive',
      icon: 'acesso',
      label: 'Chegue primeiro',
      title: 'Acesso antecipado a lançamentos',
      summary: 'Seja o primeiro a conhecer novos produtos, tecnologias e ofertas especiais.',
      detail:
        'Conheça novidades antes da abertura para todo o público e aproveite uma janela antecipada de até 48 horas nos lançamentos participantes.',
      stat: 'Até 48h antes',
    },
    {
      id: 'discount',
      category: 'economy',
      icon: 'ofertas',
      label: 'Preço de membro',
      title: 'Ofertas exclusivas para membros',
      summary: 'Tenha acesso a descontos especiais em uma seleção de produtos.',
      detail:
        'Membros Agro+ liberam o cupom AGRO20 para os itens participantes. O desconto é calculado no carrinho antes de concluir o pedido.',
      stat: '20% OFF com AGRO20',
    },
    {
      id: 'partners',
      category: 'economy',
      icon: 'parceiros',
      label: 'Vantagens que se somam',
      title: 'Condições especiais com parceiros',
      summary: 'Vantagens e descontos em marcas parceiras do agro.',
      detail:
        'Acompanhe campanhas e condições especiais oferecidas por marcas parceiras. Produtos, prazos e limites de cada oferta são informados antes da compra.',
      stat: 'Condições exclusivas',
    },
    {
      id: 'content',
      category: 'exclusive',
      icon: 'conteudo',
      label: 'Conhecimento para produzir',
      title: 'Conteúdos e dicas exclusivas',
      summary: 'Receba conteúdos técnicos, novidades e orientações para o dia a dia no campo.',
      detail:
        'Conteúdos do clube reúnem dicas de uso, novidades e orientações para aproveitar melhor os insumos e equipamentos da sua propriedade.',
      stat: 'Mais conhecimento',
    },
    {
      id: 'support',
      category: 'exclusive',
      icon: 'suporte',
      label: 'Atendimento prioritário',
      title: 'Atendimento prioritário',
      summary: 'Fale com nosso time de forma mais rápida e tenha suporte dedicado.',
      detail:
        'Receba orientação com prioridade sobre compatibilidade, características e escolha de produtos para a rotina da propriedade.',
      stat: 'Fila prioritária',
    },
  ];

  get selectedBenefit(): AgroPlusBenefit {
    return (
      this.agroPlusBenefits.find((benefit) => benefit.id === this.selectedBenefitId()) ??
      this.agroPlusBenefits[0]
    );
  }

  get visibleBenefits(): AgroPlusBenefit[] {
    const category = this.selectedBenefitCategory();

    return category === 'all'
      ? this.agroPlusBenefits
      : this.agroPlusBenefits.filter((benefit) => benefit.category === category);
  }

  get selectedBenefitPosition(): number {
    const currentIndex = this.visibleBenefits.findIndex(
      (benefit) => benefit.id === this.selectedBenefitId(),
    );

    return currentIndex >= 0 ? currentIndex + 1 : 1;
  }

  get estimatedMonthlyAdvantage(): number {
    const purchaseBenefit = this.monthlyPurchaseValue() * 0.2;
    const eligibleShippingReference = 39.9;

    return Math.max(0, purchaseBenefit + eligibleShippingReference - this.subscriptionPrice);
  }

  get estimatedYearlyAdvantage(): number {
    return this.estimatedMonthlyAdvantage * 12;
  }

  get visibleCoupons(): CouponModel[] {
    const query = this.normalizeText(this.couponSearch());
    const selectedFilter = this.selectedCouponFilter();
    const relevanceOrder = new Map(this.coupons.map((coupon, index) => [coupon.code, index]));

    return this.coupons
      .filter((coupon) => {
        const matchesFilter =
          selectedFilter === 'all' || this.couponCategories(coupon).includes(selectedFilter);
        const searchableText = this.normalizeText(
          `${coupon.code} ${this.couponTitle(coupon)} ${this.couponDescription(coupon)} ${this.couponApplicability(coupon)}`,
        );

        return matchesFilter && (!query || searchableText.includes(query));
      })
      .sort((first, second) => {
        if (this.couponSort() === 'discount') {
          return second.discountPercentage - first.discountPercentage;
        }

        if (this.couponSort() === 'code') {
          return first.code.localeCompare(second.code, 'pt-BR');
        }

        return (relevanceOrder.get(first.code) ?? 0) - (relevanceOrder.get(second.code) ?? 0);
      });
  }

  constructor() {
    this.agroPlusActive.set(this.readAgroPlusMembership());
  }

  isCouponApplied(coupon: CouponModel): boolean {
    return this.cart.coupon()?.code === coupon.code;
  }

  isAgroPlusCoupon(coupon: CouponModel): boolean {
    return coupon.code === 'AGRO20';
  }

  couponTitle(coupon: CouponModel): string {
    const titles: Record<string, string> = {
      AGRO20: 'Benefício Agro+',
      BEMVINDO10: 'Primeira compra',
      CAMPO15: 'Especial do campo',
      SAFRA12: 'Temporada da safra',
      EQUIPA10: 'Renove seus equipamentos',
      AGUA8: 'Economia na irrigação',
    };

    return titles[coupon.code] ?? 'Oferta AgroAgrega';
  }

  couponDescription(coupon: CouponModel): string {
    const descriptions: Record<string, string> = {
      AGRO20: 'Desconto exclusivo para membros Agro+ em produtos participantes.',
      BEMVINDO10: 'Uma ajuda para começar sua primeira compra no catálogo AgroAgrega.',
      CAMPO15: 'Mais economia para equipar a propriedade e cuidar da produção.',
      SAFRA12: 'Aproveite a temporada para preparar sua próxima compra.',
      EQUIPA10: 'Um incentivo para renovar ferramentas, máquinas e acessórios.',
      AGUA8: 'Economize em soluções que ajudam a cuidar de cada gota no campo.',
    };

    return descriptions[coupon.code] ?? 'Desconto disponível por tempo limitado.';
  }

  couponApplicability(coupon: CouponModel): string {
    const applicability: Record<string, string> = {
      AGRO20: 'Válido para produtos selecionados',
      BEMVINDO10: 'Válido para toda a loja',
      CAMPO15: 'Válido para produtos selecionados',
      SAFRA12: 'Válido para produtos selecionados',
      EQUIPA10: 'Válido para ferramentas e acessórios',
      AGUA8: 'Válido para produtos de irrigação',
    };

    return applicability[coupon.code] ?? 'Consulte os produtos participantes';
  }

  couponBadge(coupon: CouponModel): string | null {
    if (coupon.code === 'AGRO20') return 'Mais popular';
    if (coupon.code === 'BEMVINDO10') return 'Primeira compra';
    if (coupon.code === 'EQUIPA10') return 'Termina em breve';
    return null;
  }

  selectCouponFilter(filter: CouponFilter): void {
    this.selectedCouponFilter.set(filter);
  }

  updateCouponSearch(event: Event): void {
    this.couponSearch.set((event.target as HTMLInputElement).value);
  }

  updateCouponSort(event: Event): void {
    this.couponSort.set((event.target as HTMLSelectElement).value as CouponSort);
  }

  toggleCouponDetails(code: string): void {
    this.expandedCouponCode.update((current) => (current === code ? null : code));
  }

  openCouponSupport(): void {
    this.assistant.show();
  }

  applyCoupon(coupon: CouponModel): void {
    if (this.isAgroPlusCoupon(coupon) && !this.agroPlusActive()) {
      this.router.navigate(['/agro-plus']);
      return;
    }

    this.cart.applyCoupon(coupon.code);
    this.feedbackMessage.set(`Cupom ${coupon.code} aplicado. O desconto aparecerá no carrinho.`);
  }

  activateAgroPlus(): void {
    if (!this.auth.isLoggedIn()) {
      this.router.navigate(['/login']);
      return;
    }

    const userId = this.auth.currentUserId() || this.auth.getId();

    if (!userId) {
      this.router.navigate(['/login']);
      return;
    }

    if (isPlatformBrowser(this.platformId)) {
      localStorage.setItem(this.membershipKey(userId), 'active');
    }

    this.agroPlusActive.set(true);
    this.feedbackMessage.set('Assinatura Agro+ ativada. Seu cupom exclusivo já está disponível.');
  }

  applyAgroPlusCoupon(): void {
    this.applyCoupon(this.agroPlusCoupon);
  }

  selectBenefit(benefitId: string): void {
    if (this.agroPlusBenefits.some((benefit) => benefit.id === benefitId)) {
      this.benefitDetailsOpen.set(
        this.selectedBenefitId() !== benefitId || !this.benefitDetailsOpen(),
      );
      this.selectedBenefitId.set(benefitId);
    }
  }

  selectBenefitCategory(category: 'all' | AgroPlusBenefitCategory): void {
    this.selectedBenefitCategory.set(category);
    this.benefitDetailsOpen.set(false);
    const selectedStillVisible = this.visibleBenefits.some(
      (benefit) => benefit.id === this.selectedBenefitId(),
    );

    if (!selectedStillVisible && this.visibleBenefits.length > 0) {
      this.selectedBenefitId.set(this.visibleBenefits[0].id);
    }
  }

  showAdjacentBenefit(direction: -1 | 1): void {
    const benefits = this.visibleBenefits;

    if (benefits.length === 0) {
      return;
    }

    const currentIndex = Math.max(
      0,
      benefits.findIndex((benefit) => benefit.id === this.selectedBenefitId()),
    );
    const nextIndex = (currentIndex + direction + benefits.length) % benefits.length;
    this.selectedBenefitId.set(benefits[nextIndex].id);
  }

  updateMonthlyPurchaseValue(event: Event): void {
    const input = event.target as HTMLInputElement;
    const value = Number(input.value);
    if (!Number.isFinite(value)) return;
    this.monthlyPurchaseValue.set(Math.min(2000, Math.max(100, Math.round(value / 50) * 50)));
  }

  scrollToBenefits(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    const target = document.getElementById('vantagens-agro-plus');
    const reducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    target?.scrollIntoView?.({ behavior: reducedMotion ? 'auto' : 'smooth', block: 'start' });
    target?.focus({ preventScroll: true });
  }

  formatCurrency(value: number): string {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  }

  private readAgroPlusMembership(): boolean {
    if (!isPlatformBrowser(this.platformId) || !this.auth.isLoggedIn()) {
      return false;
    }

    const userId = this.auth.currentUserId() || this.auth.getId();
    return Boolean(userId && localStorage.getItem(this.membershipKey(userId)) === 'active');
  }

  private membershipKey(userId: string): string {
    return `agro-plus-membership-${userId}`;
  }

  private couponCategories(coupon: CouponModel): CouponFilter[] {
    const categories: Record<string, CouponFilter[]> = {
      AGRO20: ['inputs'],
      BEMVINDO10: ['first-order'],
      CAMPO15: ['livestock'],
      SAFRA12: ['inputs'],
      EQUIPA10: ['tools', 'expiring'],
      AGUA8: ['irrigation'],
    };

    return categories[coupon.code] ?? [];
  }

  private normalizeText(value: string): string {
    return value
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .trim();
  }
}
