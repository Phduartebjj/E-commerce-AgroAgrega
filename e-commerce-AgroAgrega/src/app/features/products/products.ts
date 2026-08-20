import { Component, inject } from '@angular/core';

import { ProductService } from '../../core/services/product/product.service';
import { UpperCasePipe } from '@angular/common';
import { PrecoFormatadoPipe } from '../../shared/pipes/preco-formatado-pipe';

@Component({
  selector: 'app-products',
  imports: [UpperCasePipe, PrecoFormatadoPipe],
  templateUrl: './products.html',
  styleUrl: './products.css',
})
export class ProductsComponent {
  private readonly productService = inject(ProductService);

  readonly products = this.productService.getProducts();
  readonly productCategories = this.productService.getProductCategories();
}
