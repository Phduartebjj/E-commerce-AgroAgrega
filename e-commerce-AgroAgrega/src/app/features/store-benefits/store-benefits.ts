import { isPlatformBrowser } from '@angular/common';
import { Component, inject, PLATFORM_ID, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';

import { COUPONS } from '@core/data/coupons';
import { Auth } from '@core/services/auth/auth.service';
import { Cart } from '@core/services/cart/cart.service';
import { CouponModel } from '@models/coupon';

type StoreBenefitMode = 'coupons' | 'agroPlus';
type AgroPlusBenefitCategory = 'economy' | 'exclusive' | 'support' | 'partners';

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
  imports: [RouterLink],
  templateUrl: './store-benefits.html',
  styleUrls: ['./store-benefits-visuals.css', './store-benefits.css'],
})
export class StoreBenefitsComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly cart = inject(Cart);
  readonly auth = inject(Auth);
  private readonly platformId = inject(PLATFORM_ID);

  readonly mode = (this.route.snapshot.data['storeBenefitMode'] ?? 'coupons') as StoreBenefitMode;
  readonly coupons = COUPONS;
  readonly agroPlusCoupon = COUPONS.find((coupon) => coupon.code === 'AGRO20')!;
  readonly agroPlusActive = signal(false);
  readonly feedbackMessage = signal('');
  readonly selectedBenefitId = signal('cashback');
  readonly selectedBenefitCategory = signal<'all' | AgroPlusBenefitCategory>('all');
  readonly monthlyPurchaseValue = signal(500);
  readonly subscriptionPrice = 20.9;
  readonly benefitFilters: Array<{
    id: 'all' | AgroPlusBenefitCategory;
    label: string;
  }> = [
    { id: 'all', label: 'Todas' },
    { id: 'economy', label: 'Economia' },
    { id: 'exclusive', label: 'Exclusividade' },
    { id: 'support', label: 'Tranquilidade' },
    { id: 'partners', label: 'Parceiros' },
  ];
  readonly agroPlusBenefits: AgroPlusBenefit[] = [
    {
      id: 'cashback',
      category: 'economy',
      icon: 'R$',
      label: 'Comece economizando',
      title: '20% de cashback nas primeiras compras',
      summary: 'Parte do valor volta para você usar novamente no catálogo.',
      detail:
        'Nas compras iniciais elegíveis, você recebe 20% do valor em crédito AgroAgrega. O saldo aparece na sua conta e pode reduzir o custo dos próximos insumos e equipamentos.',
      stat: '20% de volta',
    },
    {
      id: 'discount',
      category: 'economy',
      icon: '%',
      label: 'Preço de membro',
      title: 'Desconto exclusivo AGRO20',
      summary: 'Economize 20% em uma seleção de produtos participantes.',
      detail:
        'Membros Agro+ liberam o cupom AGRO20 e identificam facilmente os itens participantes. A economia é calculada no carrinho antes de concluir o pedido.',
      stat: '20% OFF',
    },
    {
      id: 'early-access',
      category: 'exclusive',
      icon: '48h',
      label: 'Chegue primeiro',
      title: 'Acesso antecipado aos lançamentos',
      summary: 'Conheça novidades antes da abertura para todo o público.',
      detail:
        'Receba uma janela antecipada de até 48 horas para avaliar e comprar produtos recém-adicionados, inclusive em lançamentos com estoque inicial limitado.',
      stat: 'Até 48h antes',
    },
    {
      id: 'limited',
      category: 'exclusive',
      icon: '★',
      label: 'Só para membros',
      title: 'Produtos e edições limitadas',
      summary: 'Acesse lotes especiais e combinações que não ficam no catálogo aberto.',
      detail:
        'Descubra equipamentos, kits sazonais e séries especiais reservados ao clube. Quando uma edição chegar, você será avisado pela sua conta.',
      stat: 'Acesso exclusivo',
    },
    {
      id: 'shipping',
      category: 'economy',
      icon: '↗',
      label: 'Mais economia',
      title: 'Frete grátis em compras elegíveis',
      summary: 'Reduza o custo de entrega nos pedidos participantes acima de R$ 399.',
      detail:
        'Pedidos elegíveis acima de R$ 399 recebem frete padrão grátis nas regiões atendidas pela campanha. A condição aparece automaticamente no carrinho.',
      stat: 'Frete R$ 0',
    },
    {
      id: 'points',
      category: 'economy',
      icon: '2x',
      label: 'Cada compra vale mais',
      title: 'AgroPontos em dobro',
      summary: 'Acumule duas vezes mais pontos em campanhas selecionadas.',
      detail:
        'Durante campanhas Agro+, produtos sinalizados rendem pontos em dobro. Depois, eles podem ser trocados por cupons e vantagens dentro da loja.',
      stat: '2x pontos',
    },
    {
      id: 'support',
      category: 'support',
      icon: '1º',
      label: 'Atendimento prioritário',
      title: 'Ajuda especializada com prioridade',
      summary: 'Tire dúvidas de compra e uso sem ficar no fim da fila.',
      detail:
        'Membros entram na fila prioritária para receber orientação sobre compatibilidade, características e escolha de produtos para a rotina da propriedade.',
      stat: 'Fila prioritária',
    },
    {
      id: 'price-protection',
      category: 'support',
      icon: '7d',
      label: 'Compra protegida',
      title: 'Proteção de preço por 7 dias',
      summary: 'Se o item baixar de preço, a diferença pode voltar como cupom.',
      detail:
        'Quando um produto elegível entrar em promoção até sete dias depois da compra, o membro pode receber a diferença em um cupom para o próximo pedido.',
      stat: '7 dias',
    },
    {
      id: 'returns',
      category: 'support',
      icon: '30',
      label: 'Mais tranquilidade',
      title: 'Prazo estendido para devolução',
      summary: 'Tenha até 30 dias para devolver produtos elegíveis.',
      detail:
        'Produtos participantes ganham uma janela ampliada de devolução, dando mais tempo para conferir o pedido e decidir com segurança.',
      stat: 'Até 30 dias',
    },
    {
      id: 'yield',
      category: 'partners',
      icon: '120',
      label: 'Benefício parceiro',
      title: 'Cofrinhos com rendimento ampliado',
      summary: 'Organize reservas em campanhas de até 120% do CDI.',
      detail:
        'Ofertas de instituições financeiras parceiras podem liberar cofrinhos promocionais de até 120% do CDI, sujeitos a elegibilidade, prazo e limites de cada campanha.',
      stat: 'Até 120% CDI',
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
      this.selectedBenefitId.set(benefitId);
    }
  }

  selectBenefitCategory(category: 'all' | AgroPlusBenefitCategory): void {
    this.selectedBenefitCategory.set(category);
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
    this.monthlyPurchaseValue.set(Number(input.value));
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
}
