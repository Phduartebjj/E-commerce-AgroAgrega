import { ProductModel } from '@models/product';

import { routes } from './../../app.routes';

import { Component, computed, inject, signal } from '@angular/core';

import { ProductService } from '../../core/services/product/product.service';

import { ProductCardComponent } from './product-card/product-card';

import { Cart } from '@core/services/cart/cart.service';

import { ActivatedRoute } from '@angular/router';

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

  readonly products = this.productService.getProducts();

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
    const category = this.selectedCategory();
    const search = this.searchTerm();

    return this.products.filter((product) => {
      
      const searchableText = `${product.title} ${product.category}`.toLowerCase();

      const matchesCategory = !category || product.category === category;

      const matchesSearch = !search || searchableText.includes(search);

      return matchesCategory && matchesSearch;
    });

    if (!category) {
      return this.products;
    }

    return this.products.filter((product) => product.category === category);
  });

  addProductToCart(product: ProductModel): void {
    this.cart.addCartItem(product);
  }
}
