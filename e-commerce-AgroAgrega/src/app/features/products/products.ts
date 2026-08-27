import { Component, computed, inject, signal } from '@angular/core';
import { ProductCategory, ProductModel, SortOption } from '@models/product';

import { Component, computed, effect, inject, signal } from '@angular/core';

import { ProductService } from '../../core/services/product/product.service';

import { ProductCardComponent } from './product-card/product-card';

import { Cart } from '@core/services/cart/cart.service';

import { ActivatedRoute, Router } from '@angular/router';

import { toSignal } from '@angular/core/rxjs-interop';

@Component({
  selector: 'app-products',
  imports: [ProductCardComponent],
  templateUrl: './products.html',
  styleUrl: './products.css',
})
export class ProductsComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly productService = inject(ProductService);
  private readonly cart = inject(Cart);
  private readonly queryParams = toSignal(this.route.queryParamMap, {
    initialValue: this.route.snapshot.queryParamMap,
  });
  private readonly router = inject(Router);
  readonly categories = this.productService.getProductCategories();
  readonly sortOption = signal<SortOption>('relevant');

  readonly selectedCategories = signal<ProductCategory[]>([]);
  readonly products = this.productService.getProducts();
  readonly productCategories = this.productService.getProductCategories();
  readonly categoryFilters = ['Todos', ...this.productCategories];
  
  // UI State
  readonly selectedCategory = signal<string>('Todos');
  readonly viewMode = signal<'grid' | 'list'>('grid');
  readonly maxPriceFilter = signal<number>(5000);
  readonly sortOrder = signal<string>('mais_vendidos');

  // Funcionalidades dos filtros
  readonly availableBrands = ['Biomatrix', 'AgroSense', 'MultiGrão', 'SafraMax'];
  readonly selectedBrands = signal<string[]>([]);
  readonly inStockOnly = signal<boolean>(false);
  readonly minRating = signal<number>(0);

  // Computed para Destaques
  readonly featuredProducts = computed(() => {
    // Pega os dois primeiros itens da lista geral como destaques
    return this.products.slice(0, 2);
  });
  readonly selectedRating = signal<number | null>(null);

  readonly selectedCategory = computed(() => {
    return this.queryParams().get('category');
  });

  readonly searchTerm = computed(() => {
    return (this.queryParams().get('search') ?? '').trim().toLowerCase();
  });

  readonly catalogTitle = computed(() => {
    const category = this.selectedCategory();

    return category ?? 'Todas as categorias';
  });

  readonly filteredProducts = computed(() => {
    let filtered = [...this.products];
    const category = this.selectedCategory();
    const maxPrice = this.maxPriceFilter();
    const brands = this.selectedBrands();

    // 1. Filtrar por categoria
    if (category !== 'Todos') {
      filtered = filtered.filter((product) => product.category === category);
    }
    
    // 2. Filtrar por preço máximo
    filtered = filtered.filter((product) => {
      const p = product as any; 
      if (p.price !== undefined) {
         return p.price <= maxPrice;
      }
      return true;
    });

    // 3. Filtrar por marca (busca no nome ou descrição se a model não tiver 'brand')
    if (brands.length > 0) {
      filtered = filtered.filter(product => {
         return brands.some(b => 
           product.title.toLowerCase().includes(b.toLowerCase()) || 
           product.description.toLowerCase().includes(b.toLowerCase())
         );
      });
    }
    
    // 4. Ordenar
    const sort = this.sortOrder();
    if (sort === 'menor_preco') {
      filtered.sort((a: any, b: any) => (a.price || 0) - (b.price || 0));
    } else if (sort === 'maior_preco') {
      filtered.sort((a: any, b: any) => (b.price || 0) - (a.price || 0));
    }

    return filtered;
  });

  selectCategory(category: string): void {
    this.selectedCategory.set(category);
    const selectedRating = this.selectedRating();
    const search = this.searchTerm();
    const sortOption = this.sortOption();
    const products = [...this.products()];
    const selectedCategories = this.selectedCategories();

    const filteredProducts = products.filter((product) => {
      const searchableText = `${product.title} ${product.category}`.toLowerCase();
      const matchesRating = selectedRating === null || product.rating >= selectedRating;

      const matchesCategory =
        selectedCategories.length === 0 || selectedCategories.includes(product.category);

      const matchesSearch = !search || searchableText.includes(search);

      return matchesCategory && matchesSearch && matchesRating;
    });

    if (sortOption === 'price-asc') {
      return filteredProducts.sort((a, b) => a.price - b.price);
    }
    if (sortOption === 'price-desc') {
      return filteredProducts.sort((a, b) => b.price - a.price);
    }
    return filteredProducts;
  });

  readonly categoryCounts = computed(() => {
    const products = this.products();

    return this.categories.map((category) => {
      const count = products.filter((product) => product.category === category).length;
      return { category, count };
    });
  });

  toggleCategory(category: ProductCategory): void {
    this.selectedCategories.update((categories) => {
      if (categories.includes(category)) {
        return categories.filter((c) => c !== category);
      }
      return [...categories, category];
    });
  }

  clearFilters(): void {
    this.selectedCategories.set([]);
    this.sortOption.set('relevant');
    this.selectedRating.set(null);
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: {},
    });
  }

  addProductToCart(product: ProductModel): void {
    this.cart.addCartItem(product);
  }

  setViewMode(mode: 'grid' | 'list'): void {
    this.viewMode.set(mode);
  }
  
  updateMaxPrice(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.maxPriceFilter.set(Number(input.value));
  }
  
  updateSortOrder(event: Event): void {
    const select = event.target as HTMLSelectElement;
    this.sortOrder.set(select.value);
  }

  toggleBrand(brand: string, event: Event): void {
    const isChecked = (event.target as HTMLInputElement).checked;
    if (isChecked) {
      this.selectedBrands.update(brands => [...brands, brand]);
    } else {
      this.selectedBrands.update(brands => brands.filter(b => b !== brand));
    }
  }

  setInStockOnly(event: Event): void {
     this.inStockOnly.set((event.target as HTMLInputElement).checked);
  }

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
