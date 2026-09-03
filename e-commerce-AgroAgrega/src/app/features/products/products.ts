import { Component, computed, effect, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';

import { BrandOption, ProductCategory, ProductModel } from '@models/product';
import { Cart } from '@core/services/cart/cart.service';
import { ProductService } from '../../core/services/product/product.service';
import { PrecoFormatadoPipe } from '../../shared/pipes/preco-formatado-pipe';
import { ProductCardComponent } from './product-card/product-card';

type CategoryFilter = ProductCategory | 'Todos';
type CatalogSortOrder = 'mais_vendidos' | 'melhor_avaliados' | 'menor_preco' | 'maior_preco';

const PRODUCTS_PER_PAGE = 12;

function normalizeCatalogText(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase('pt-BR');
}

@Component({
  selector: 'app-products',
  imports: [ProductCardComponent, RouterLink, PrecoFormatadoPipe],
  templateUrl: './products.html',
  styleUrl: './products.css',
})
export class ProductsComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly productService = inject(ProductService);
  private readonly cart = inject(Cart);

  private readonly addedProductIds = signal<Set<string>>(new Set());
  private readonly queryParams = toSignal(this.route.queryParamMap, {
    initialValue: this.route.snapshot.queryParamMap,
  });

  readonly products = this.productService.getProducts();
  readonly productCategories = this.productService.getProductCategories();
  readonly categoryFilters: CategoryFilter[] = ['Todos', ...this.productCategories];

  readonly selectedCategory = computed<CategoryFilter>(() => {
    const category = this.queryParams().get('category');

    return this.productCategories.includes(category as ProductCategory)
      ? (category as ProductCategory)
      : 'Todos';
  });

  readonly searchTerm = computed(() => (this.queryParams().get('search') ?? '').trim());
  readonly viewMode = signal<'grid' | 'list'>('grid');
  readonly filtersOpen = signal(false);
  readonly selectedBrands = signal<BrandOption[]>([]);
  readonly minRating = signal(0);
  readonly sortOrder = signal<CatalogSortOrder>('mais_vendidos');
  readonly currentPage = signal(1);

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
    if (this.minRating() > 0) count += 1;
    if (this.maxPriceFilter() < this.maxCatalogPrice()) count += 1;

    return count;
  });

  readonly featuredProducts = computed(() =>
    [...this.products()]
      .sort((first, second) => (second.weeklySales ?? 0) - (first.weeklySales ?? 0))
      .slice(0, 2),
  );

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
  }

  selectCategory(category: CategoryFilter): void {
    this.resetPagination();
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { category: category === 'Todos' ? null : category },
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
      queryParams: { category: null, search: null },
      queryParamsHandling: 'merge',
    });
  }

  isProductAdded(productId: string): boolean {
    return this.addedProductIds().has(productId);
  }

  addProductToCart(product: ProductModel): void {
    this.cart.addCartItem(product);
    this.addedProductIds.update((ids) => new Set([...ids, product.id]));

    setTimeout(() => {
      this.addedProductIds.update((ids) => {
        const newIds = new Set(ids);
        newIds.delete(product.id);
        return newIds;
      });
    }, 2000);
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
}
