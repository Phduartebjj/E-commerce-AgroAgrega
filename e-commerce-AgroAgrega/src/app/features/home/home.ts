import { Component, inject, computed } from '@angular/core';

import { Hero } from './components/hero/hero';
import { Benefits } from './components/benefits/benefits';
import { ProductCarousel } from './components/product-carousel/product-carousel';

import { ProductService } from '@core/services/product/product.service';

@Component({
  selector: 'app-home',
  imports: [Hero, Benefits, ProductCarousel],
  templateUrl: './home.html',
  styleUrl: './home.css',
})
export class Home {
  private readonly productService = inject(ProductService);

  readonly produtosDestaque = this.productService.getProducts();

  readonly maisVendidos = computed(() =>
    [...this.produtosDestaque()]
      .sort((a, b) => (b.weeklySales ?? 0) - (a.weeklySales ?? 0))
      .slice(0, 6)
  );
}