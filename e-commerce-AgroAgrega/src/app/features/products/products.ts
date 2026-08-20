import { Component, inject } from '@angular/core';

import { ProductService } from '../../core/services/product/product.service';
import { ProductCardComponent } from './product-card/product-card';

@Component({
  selector: 'app-products',
  imports: [ProductCardComponent],
  templateUrl: './products.html',
  styleUrl: './products.css',
})
export class ProductsComponent {
  private readonly productService = inject(ProductService);

  readonly products = this.productService.getProducts();
  readonly productCategories = this.productService.getProductCategories();
}
