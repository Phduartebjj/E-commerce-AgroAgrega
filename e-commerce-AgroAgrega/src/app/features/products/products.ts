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
