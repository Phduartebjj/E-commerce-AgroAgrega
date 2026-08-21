import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';

import { ProductService } from '../../core/services/product/product';
import { Product as ProductModel } from '../../models/product';

@Component({
  selector: 'app-product-details',
  imports: [CommonModule, RouterLink],
  templateUrl: './product-details.html',
  styleUrl: './product-details.css',
})
export class ProductDetails implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly productService = inject(ProductService);

  product?: ProductModel;
  isLoading = true;
  errorMessage = '';

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');

    if (!id) {
      this.errorMessage = 'Produto não encontrado.';
      this.isLoading = false;
      return;
    }

    this.productService.getProductById(id).subscribe({
      next: (product) => {
        if (!product) {
          this.errorMessage = 'Produto não encontrado.';
        } else {
          this.product = product;
        }

        this.isLoading = false;
      },
      error: () => {
        this.errorMessage = 'Erro ao carregar os detalhes do produto.';
        this.isLoading = false;
      },
    });
  }
}
