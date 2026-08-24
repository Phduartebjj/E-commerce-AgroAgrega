
import { Component, computed, inject, signal } from '@angular/core';

import { ProductService } from '../../core/services/product/product.service';
import { ProductCardComponent } from './product-card/product-card';
import { Cart } from '@core/services/cart/cart.service';
import { ProductModel } from '@models/product';

@Component({
  selector: 'app-products',
  imports: [ProductCardComponent],
  templateUrl: './products.html',
  styleUrl: './products.css',
})
export class ProductsComponent {
  private readonly productService = inject(ProductService);
  private readonly cart = inject(Cart);

  readonly products = this.productService.getProducts();
  readonly productCategories = this.productService.getProductCategories();
  readonly categoryFilters = ['Todos', ...this.productCategories];
  readonly selectedCategory = signal<string>('Todos');

  readonly filteredProducts = computed(() => {
    const category = this.selectedCategory();

    if (category === 'Todos') {
      return this.products;
    }

    return this.products.filter((product) => product.category === category);
  });

  selectCategory(category: string): void {
    this.selectedCategory.set(category);
  }

  addProductToCart(product: ProductModel): void {
    this.cart.addCartItem(product);
  }
}
