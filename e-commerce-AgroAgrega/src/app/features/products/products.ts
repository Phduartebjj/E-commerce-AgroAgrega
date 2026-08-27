import { Component, computed, effect, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';

import { ProductCategory, ProductModel, SortOption } from '@models/product';

import { ProductService } from '../../core/services/product/product.service';
import { ProductCardComponent } from './product-card/product-card';
import { Cart } from '@core/services/cart/cart.service';

@Component({
  selector: 'app-products',
  imports: [ProductCardComponent],
  templateUrl: './products.html',
  styleUrl: './products.css',
})
export class ProductsComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly productService = inject(ProductService);
  private readonly cart = inject(Cart);

  private readonly queryParams = toSignal(this.route.queryParamMap, {
    initialValue: this.route.snapshot.queryParamMap,
  });

  // Produtos e categorias
  readonly products = this.productService.getProducts();
  readonly categories = this.productService.getProductCategories();
  readonly productCategories = this.productService.getProductCategories();
  readonly categoryFilters = ['Todos', ...this.productCategories];

  // Estado dos filtros
  readonly selectedCategories = signal<ProductCategory[]>([]);
  readonly sortOption = signal<SortOption>('relevant');

  readonly ratingOptions = [
    { value: 5, stars: '★★★★★' },
    { value: 4, stars: '★★★★☆' },
    { value: 3, stars: '★★★☆☆' },
    { value: 2, stars: '★★☆☆☆' },
    { value: 1, stars: '★☆☆☆☆' },
  ];

  readonly selectedCategory = computed(() => {
    return this.queryParams().get('category');
  });

  readonly searchTerm = computed(() => {
    return (this.queryParams().get('search') ?? '').trim().toLowerCase();
  });

  // Estado da interface
  readonly viewMode = signal<'grid' | 'list'>('grid');
  readonly maxPriceFilter = signal<number>(5000);
  readonly sortOrder = signal<string>('mais_vendidos');

  // Filtros adicionais
  readonly availableBrands = ['Biomatrix', 'AgroSense', 'MultiGrão', 'SafraMax'];

  readonly selectedBrands = signal<string[]>([]);
  readonly minRating = signal<number>(0);

  // Produtos em destaque
  readonly featuredProducts = computed(() => {
    return this.products().slice(0, 2);
  });

  // Produtos filtrados
  readonly filteredProducts = computed(() => {
    let filtered = [...this.products()];

    const category = this.selectedCategory();
    const search = this.searchTerm();
    const selectedCategories = this.selectedCategories();
    const minRating = this.minRating();
    const maxPrice = this.maxPriceFilter();
    const brands = this.selectedBrands();

    // 1. Categoria da URL
    if (category && category !== 'Todos') {
      filtered = filtered.filter((product) => product.category === category);
    }

    if(minRating > 0) {
      filtered = filtered.filter((product) => product.rating >= minRating);
    }

    // 2. Categorias selecionadas nos filtros
    if (selectedCategories.length > 0) {
      filtered = filtered.filter((product) => selectedCategories.includes(product.category));
    }

    // 3. Pesquisa
    if (search) {
      filtered = filtered.filter((product) => {
        const searchableText =
          `${product.title} ${product.category} ${product.description}`.toLowerCase();

        return searchableText.includes(search);
      });
    }

    // 4. Preço máximo
    filtered = filtered.filter((product) => {
      return product.price <= maxPrice;
    });

    // 5. Marca
    if (brands.length > 0) {
      filtered = filtered.filter((product) => {
        return brands.some(
          (brand) =>
            product.title.toLowerCase().includes(brand.toLowerCase()) ||
            product.description.toLowerCase().includes(brand.toLowerCase()),
        );
      });
    }

    // 7. Ordenação
    const sort = this.sortOrder();

    if (sort === 'menor_preco' || sort === 'price-asc') {
      filtered.sort((a, b) => a.price - b.price);
    } else if (sort === 'maior_preco' || sort === 'price-desc') {
      filtered.sort((a, b) => b.price - a.price);
    }

    return filtered;
  });

  // Seleciona categoria
  selectCategory(category: string): void {
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { category },
      queryParamsHandling: 'merge',
    });
  }

  // Limpa filtros
  clearFilters(): void {
    this.selectedCategories.set([]);
    this.sortOption.set('relevant');
    this.selectedBrands.set([]);
    this.minRating.set(0);
    this.maxPriceFilter.set(5000);
    this.sortOrder.set('mais_vendidos');

    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: {},
    });
  }

  // Adiciona produto ao carrinho
  addProductToCart(product: ProductModel): void {
    this.cart.addCartItem(product);
  }

  // Alterna visualização
  setViewMode(mode: 'grid' | 'list'): void {
    this.viewMode.set(mode);
  }

  // Atualiza preço máximo
  updateMaxPrice(event: Event): void {
    const input = event.target as HTMLInputElement;

    this.maxPriceFilter.set(Number(input.value));
  }

  // Atualiza ordenação
  updateSortOrder(event: Event): void {
    const select = event.target as HTMLSelectElement;

    this.sortOrder.set(select.value);
  }

  // Marca
  toggleBrand(brand: string, event: Event): void {
    const isChecked = (event.target as HTMLInputElement).checked;

    if (isChecked) {
      this.selectedBrands.update((brands) => [...brands, brand]);
    } else {
      this.selectedBrands.update((brands) => brands.filter((current) => current !== brand));
    }
  }

  // Avaliação mínima
  setMinRating(rating: number): void {
    this.minRating.set(rating);
  }

  constructor() {
    effect(() => {
      const category = this.selectedCategory();

      if (category && this.categories.includes(category as ProductCategory)) {
        this.selectedCategories.set([category as ProductCategory]);

        return;
      }

      this.selectedCategories.set([]);
    });
  }
}
