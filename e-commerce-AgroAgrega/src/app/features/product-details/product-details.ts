import { CommonModule } from '@angular/common';
import { Component, computed, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';

import { ProductService } from '../../core/services/product/product';

@Component({
  selector: 'app-product-details',
  imports: [CommonModule, RouterLink],
  templateUrl: './product-details.html',
  styleUrl: './product-details.css',
})
export class ProductDetails {
  private readonly route = inject(ActivatedRoute);
  private readonly productService = inject(ProductService);

  readonly id = this.route.snapshot.paramMap.get('id') ?? '';
  readonly product = computed(() => this.productService.getProductById(this.id));
}
