import { isPlatformBrowser } from '@angular/common';
import {
  Component,
  computed,
  DestroyRef,
  effect,
  inject,
  PLATFORM_ID,
  signal,
} from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';

import { BrandOption, ProductCategory, ProductModel } from '@models/product';
import { ProductService } from '../../core/services/product/product.service';
import { PrecoFormatadoPipe } from '../../shared/pipes/preco-formatado-pipe';
import { StoreAssistantState } from '../../shared/components/store-assistant/store-assistant-state';
import { ProductCardComponent } from './product-card/product-card';
import { ProductComparisonComponent } from './product-comparison/product-comparison';

type CategoryFilter = ProductCategory | 'Todos';
type CatalogSortOrder = 'mais_vendidos' | 'melhor_avaliados' | 'menor_preco' | 'maior_preco';
type CatalogFilterType = 'category' | 'search' | 'brand' | 'rating' | 'price' | 'offers';

interface CatalogFilterChip {
  key: string;
  label: string;
  type: CatalogFilterType;
  value?: string;
}

const PRODUCTS_PER_PAGE = 12;

function normalizeCatalogText(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase('pt-BR');
}

@Component({
  selector: 'app-products',
  imports: [ProductCardComponent, ProductComparisonComponent, RouterLink, PrecoFormatadoPipe],
  templateUrl: './products.html',
  styleUrl: './products.css',
})
export class ProductsComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly productService = inject(ProductService);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly destroyRef = inject(DestroyRef);
  private countdownTimer?: ReturnType<typeof setInterval>;

  private readonly queryParams = toSignal(this.route.queryParamMap, {
    initialValue: this.route.snapshot.queryParamMap,
  });

  readonly assistant = inject(StoreAssistantState);
  readonly categoryArtwork: Record<ProductCategory, { image: string; icon: string }> = {
    'Agricultura de Precisão': {
      image: 'assets/images/generated-products/product-001.webp',
      icon: 'M12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6ZM12 2v3M12 19v3M2 12h3M19 12h3M5 5l2 2M17 17l2 2M5 19l2-2M17 7l2-2',
    },
    Irrigação: {
      image: 'assets/images/generated-products/product-004.webp',
      icon: 'M12 2S5 10 5 15a7 7 0 0 0 14 0c0-5-7-13-7-13ZM9 15a3 3 0 0 0 3 3',
    },
    Pecuária: {
      image: 'assets/images/generated-products/product-009.webp',
      icon: 'M6 8 3 4 2 10l4 2v6l3 3h6l3-3v-6l4-2-1-6-3 4ZM9 13h.01M15 13h.01M9 18h6',
    },
    Ferramentas: {
      image: 'assets/images/generated-products/product-010.webp',
      icon: 'm14 6 4-4a6 6 0 0 1-7 8L4 21l-3-3 10-8a6 6 0 0 1 7-8l-4 4Z',
    },
    Insumos: {
      image: 'assets/images/generated-products/product-002.webp',
      icon: 'M12 22V10M12 16C4 16 2 11 3 5c6 0 9 4 9 11ZM12 11c0-6 4-9 10-9 0 6-4 10-10 9',
    },
  };
  readonly products = this.productService.getProducts();
  readonly productCategories = this.productService.getProductCategories();
  readonly categoryFilters: CategoryFilter[] = ['Todos', ...this.productCategories];
  readonly categoryProductCounts = computed(() =>
    this.productCategories.map((category) => ({
      category,
      count: this.products().filter((product) => product.category === category).length,
    })),
  );

  readonly selectedCategory = computed<CategoryFilter>(() => {
    const category = this.queryParams().get('category');

    return this.productCategories.includes(category as ProductCategory)
      ? (category as ProductCategory)
      : 'Todos';
  });

  readonly searchTerm = computed(() => (this.queryParams().get('search') ?? '').trim());
  readonly offersOnly = computed(() => this.queryParams().get('offers') === 'true');
  readonly currentTime = signal(new Date());
  readonly flashOfferProducts = computed(() =>
    this.products().filter((product) => product.flashOffer),
  );
  readonly flashOfferDateLabel = computed(() =>
    new Intl.DateTimeFormat('pt-BR', {
      weekday: 'long',
      day: '2-digit',
      month: 'long',
    }).format(this.currentTime()),
  );
  readonly flashOfferCountdown = computed(() => formatFlashOfferCountdown(this.currentTime()));
  readonly highestFlashDiscount = computed(() =>
    Math.max(...this.flashOfferProducts().map((product) => product.flashOfferDiscount ?? 0), 0),
  );
  readonly viewMode = signal<'grid' | 'list'>('grid');
  readonly filtersOpen = signal(false);
  readonly selectedBrands = signal<BrandOption[]>([]);
  readonly minRating = signal(0);
  readonly sortOrder = signal<CatalogSortOrder>('mais_vendidos');
  readonly currentPage = signal(1);
  readonly comparedProductIds = signal<Set<string>>(new Set());
  readonly comparisonOpen = signal(false);
  readonly comparisonAnnouncement = signal('');

  readonly maxCatalogPrice = computed(() => {
    const highestPrice = Math.max(...this.products().map((product) => product.price), 0);

    return Math.max(500, Math.ceil(highestPrice / 500) * 500);
  });

  readonly maxPriceFilter = signal(this.maxCatalogPrice());

  readonly availableBrands = computed(() => {
    const brands = this.products()
      .map((product) => product.brand)
      .filter((brand): brand is Exclude<BrandOption, 'none'> => Boolean(brand && brand !== 'none'));

    return [...new Set(brands)].sort((first, second) => first.localeCompare(second, 'pt-BR'));
  });

  readonly activeFilterCount = computed(() => {
    let count = this.selectedBrands().length;

    if (this.selectedCategory() !== 'Todos') count += 1;
    if (this.searchTerm()) count += 1;
    if (this.offersOnly()) count += 1;
    if (this.minRating() > 0) count += 1;
    if (this.maxPriceFilter() < this.maxCatalogPrice()) count += 1;

    return count;
  });

  readonly activeFilterChips = computed<CatalogFilterChip[]>(() => {
    const chips: CatalogFilterChip[] = [];
    const category = this.selectedCategory();
    const search = this.searchTerm();

    if (category !== 'Todos') {
      chips.push({ key: 'category', label: category, type: 'category' });
    }

    if (search) {
      chips.push({ key: 'search', label: `Busca: “${search}”`, type: 'search' });
    }

    if (this.offersOnly()) {
      chips.push({ key: 'offers', label: 'Ofertas relâmpago de hoje', type: 'offers' });
    }

    for (const brand of this.selectedBrands()) {
      chips.push({ key: `brand-${brand}`, label: brand, type: 'brand', value: brand });
    }

    if (this.minRating() > 0) {
      chips.push({
        key: 'rating',
        label: this.minRating() === 5 ? 'Nota 5' : `${this.minRating()}+ estrelas`,
        type: 'rating',
      });
    }

    if (this.maxPriceFilter() < this.maxCatalogPrice()) {
      chips.push({
        key: 'price',
        label: `Até ${this.formatCurrency(this.maxPriceFilter())}`,
        type: 'price',
      });
    }

    return chips;
  });

  readonly featuredProducts = this.productService.getDailyPopularProducts(8);

  private readonly featureProductsOnFirstPage = computed(
    () => this.activeFilterCount() === 0 && this.sortOrder() === 'mais_vendidos',
  );

  readonly showFeaturedProducts = computed(
    () => this.featureProductsOnFirstPage() && this.currentPage() === 1,
  );

  readonly filteredProducts = computed(() => {
    let filtered = [...this.products()];
    const category = this.selectedCategory();
    const search = normalizeCatalogText(this.searchTerm());
    const selectedBrands = this.selectedBrands();
    const minRating = this.minRating();
    const maxPrice = this.maxPriceFilter();

    if (category !== 'Todos') {
      filtered = filtered.filter((product) => product.category === category);
    }

    if (search) {
      filtered = filtered.filter((product) => {
        const searchableText = normalizeCatalogText(
          `${product.title} ${product.category} ${product.description} ${product.brand ?? ''}`,
        );

        return searchableText.includes(search);
      });
    }

    if (this.offersOnly()) {
      filtered = filtered.filter((product) => product.flashOffer);
    }

    filtered = filtered.filter((product) => product.price <= maxPrice);

    if (selectedBrands.length > 0) {
      filtered = filtered.filter((product) => selectedBrands.includes(product.brand ?? 'none'));
    }

    if (minRating > 0) {
      filtered = filtered.filter((product) => product.rating >= minRating);
    }

    switch (this.sortOrder()) {
      case 'menor_preco':
        filtered.sort((first, second) => first.price - second.price);
        break;
      case 'maior_preco':
        filtered.sort((first, second) => second.price - first.price);
        break;
      case 'melhor_avaliados':
        filtered.sort(
          (first, second) =>
            second.rating - first.rating || (second.weeklySales ?? 0) - (first.weeklySales ?? 0),
        );
        break;
      default:
        filtered.sort(
          (first, second) =>
            (second.weeklySales ?? 0) - (first.weeklySales ?? 0) || second.rating - first.rating,
        );
    }

    return filtered;
  });

  readonly resultsLabel = computed(() => {
    const count = this.filteredProducts().length;

    if (this.offersOnly()) {
      return `${count} ${count === 1 ? 'oferta relâmpago ativa' : 'ofertas relâmpago ativas'}`;
    }

    return `${count} ${count === 1 ? 'produto encontrado' : 'produtos encontrados'}`;
  });

  readonly comparedProducts = computed(() => {
    const comparedIds = this.comparedProductIds();
    return this.products().filter((product) => comparedIds.has(product.id));
  });

  readonly catalogGridProducts = computed(() => {
    const products = this.filteredProducts();

    if (!this.featureProductsOnFirstPage()) return products;

    const featuredIds = new Set(this.featuredProducts().map((product) => product.id));

    return products.filter((product) => !featuredIds.has(product.id));
  });

  readonly totalPages = computed(() => this.calculateTotalPages());

  readonly pageNumbers = computed(() =>
    Array.from({ length: this.totalPages() }, (_, index) => index + 1),
  );

  readonly visibleProducts = computed(() => {
    if (this.featureProductsOnFirstPage()) {
      const firstPageCapacity = Math.max(0, PRODUCTS_PER_PAGE - this.featuredProducts().length);

      if (this.currentPage() === 1) {
        return this.catalogGridProducts().slice(0, firstPageCapacity);
      }

      const startIndex = firstPageCapacity + (this.currentPage() - 2) * PRODUCTS_PER_PAGE;

      return this.catalogGridProducts().slice(startIndex, startIndex + PRODUCTS_PER_PAGE);
    }

    const startIndex = (this.currentPage() - 1) * PRODUCTS_PER_PAGE;

    return this.catalogGridProducts().slice(startIndex, startIndex + PRODUCTS_PER_PAGE);
  });

  readonly pageAnnouncement = computed(
    () => `Página ${this.currentPage()} de ${this.totalPages()} carregada.`,
  );

  constructor() {
    effect(() => {
      this.queryParams();
      this.resetPagination();
    });

    if (isPlatformBrowser(this.platformId)) {
      this.countdownTimer = setInterval(() => this.currentTime.set(new Date()), 1000);
      this.destroyRef.onDestroy(() => clearInterval(this.countdownTimer));
    }
  }

  selectCategory(category: CategoryFilter): void {
    this.resetPagination();
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { category: category === 'Todos' ? null : category },
      queryParamsHandling: 'merge',
    });
  }

  clearCatalogSearch(): void {
    this.resetPagination();
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { search: null },
      queryParamsHandling: 'merge',
    });
  }

  clearFilters(): void {
    this.selectedBrands.set([]);
    this.minRating.set(0);
    this.maxPriceFilter.set(this.maxCatalogPrice());
    this.sortOrder.set('mais_vendidos');
    this.resetPagination();

    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { category: null, search: null, offers: null },
      queryParamsHandling: 'merge',
    });
  }

  removeActiveFilter(filter: CatalogFilterChip): void {
    switch (filter.type) {
      case 'category':
        this.selectCategory('Todos');
        return;
      case 'search':
        this.clearCatalogSearch();
        return;
      case 'brand':
        this.selectedBrands.update((brands) => brands.filter((brand) => brand !== filter.value));
        break;
      case 'rating':
        this.minRating.set(0);
        break;
      case 'price':
        this.maxPriceFilter.set(this.maxCatalogPrice());
        break;
      case 'offers':
        this.router.navigate([], {
          relativeTo: this.route,
          queryParams: { offers: null },
          queryParamsHandling: 'merge',
        });
        return;
    }

    this.resetPagination();
  }

  isProductCompared(productId: string): boolean {
    return this.comparedProductIds().has(productId);
  }

  toggleProductComparison(product: ProductModel): void {
    const currentIds = this.comparedProductIds();

    if (currentIds.has(product.id)) {
      this.removeComparedProduct(product.id);
      return;
    }

    if (currentIds.size >= 3) {
      this.comparisonAnnouncement.set('Você pode comparar até 3 produtos por vez.');
      return;
    }

    this.comparedProductIds.set(new Set([...currentIds, product.id]));
    this.comparisonAnnouncement.set(
      `${product.title} foi adicionado à comparação. ${currentIds.size + 1} de 3 selecionados.`,
    );
  }

  removeComparedProduct(productId: string): void {
    const product = this.products().find((item) => item.id === productId);
    const nextIds = new Set(this.comparedProductIds());
    nextIds.delete(productId);
    this.comparedProductIds.set(nextIds);

    if (nextIds.size < 2) {
      this.comparisonOpen.set(false);
    }

    this.comparisonAnnouncement.set(
      product ? `${product.title} foi removido da comparação.` : 'Produto removido da comparação.',
    );
  }

  clearComparison(): void {
    this.comparedProductIds.set(new Set());
    this.comparisonOpen.set(false);
    this.comparisonAnnouncement.set('Seleção de comparação limpa.');
  }

  openComparison(): void {
    if (this.comparedProducts().length < 2) {
      this.comparisonAnnouncement.set('Selecione pelo menos 2 produtos para comparar.');
      return;
    }

    this.comparisonOpen.set(true);
  }

  closeComparison(): void {
    this.comparisonOpen.set(false);
  }

  scrollFeaturedProducts(carousel: HTMLElement, direction: -1 | 1): void {
    const prefersReducedMotion =
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    carousel.scrollBy({
      left: direction * Math.max(300, carousel.clientWidth * 0.82),
      behavior: prefersReducedMotion ? 'auto' : 'smooth',
    });
  }

  scrollToProducts(targetId = 'catalog-results'): void {
    if (!isPlatformBrowser(this.platformId)) return;
    const target = document.getElementById(targetId);
    const reducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    target?.scrollIntoView({ behavior: reducedMotion ? 'auto' : 'smooth', block: 'start' });
  }

  setViewMode(mode: 'grid' | 'list'): void {
    this.viewMode.set(mode);
  }

  updateMaxPrice(event: Event): void {
    this.maxPriceFilter.set(Number((event.target as HTMLInputElement).value));
    this.resetPagination();
  }

  updateSortOrder(event: Event): void {
    this.sortOrder.set((event.target as HTMLSelectElement).value as CatalogSortOrder);
    this.resetPagination();
  }

  toggleBrand(brand: BrandOption, event: Event): void {
    const isChecked = (event.target as HTMLInputElement).checked;

    this.selectedBrands.update((brands) =>
      isChecked ? [...new Set([...brands, brand])] : brands.filter((current) => current !== brand),
    );
    this.resetPagination();
  }

  setMinRating(rating: number): void {
    this.minRating.set(rating);
    this.resetPagination();
  }

  toggleFilters(): void {
    this.filtersOpen.update((isOpen) => !isOpen);
  }

  goToPage(page: number): void {
    if (
      !Number.isInteger(page) ||
      page < 1 ||
      page > this.totalPages() ||
      page === this.currentPage()
    ) {
      return;
    }

    this.currentPage.set(page);

    const resultsSection = document.getElementById('catalog-results');

    if (typeof resultsSection?.scrollIntoView === 'function') {
      const prefersReducedMotion =
        typeof window.matchMedia === 'function' &&
        window.matchMedia('(prefers-reduced-motion: reduce)').matches;

      resultsSection.scrollIntoView({
        behavior: prefersReducedMotion ? 'auto' : 'smooth',
        block: 'start',
      });
    }

    if (typeof resultsSection?.focus === 'function') {
      resultsSection.focus({ preventScroll: true });
    }
  }

  private calculateTotalPages(): number {
    const gridProductCount = this.catalogGridProducts().length;

    if (!this.featureProductsOnFirstPage()) {
      return Math.max(1, Math.ceil(gridProductCount / PRODUCTS_PER_PAGE));
    }

    const firstPageCapacity = Math.max(0, PRODUCTS_PER_PAGE - this.featuredProducts().length);
    const remainingProducts = Math.max(0, gridProductCount - firstPageCapacity);

    return 1 + Math.ceil(remainingProducts / PRODUCTS_PER_PAGE);
  }

  private resetPagination(): void {
    this.currentPage.set(1);
  }

  private formatCurrency(value: number): string {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      maximumFractionDigits: 2,
    }).format(value);
  }
}

export function formatFlashOfferCountdown(date: Date): string {
  const nextDay = new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1);
  const remainingSeconds = Math.max(0, Math.floor((nextDay.getTime() - date.getTime()) / 1000));
  const hours = Math.floor(remainingSeconds / 3600);
  const minutes = Math.floor((remainingSeconds % 3600) / 60);
  const seconds = remainingSeconds % 60;

  return [hours, minutes, seconds].map((value) => String(value).padStart(2, '0')).join(':');
}
