import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

import {
  ProductCatalogQuery,
  ProductCatalogResult,
  ProductService,
} from '../../core/services/product/product';
import { Product as ProductModel } from '../../models/product';

@Component({
  selector: 'app-products',
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './products.html',
  styleUrl: './products.css',
})
export class Products implements OnInit {
  private readonly productService = inject(ProductService);

  products: ProductModel[] = [];
  categories: string[] = [];

  query: ProductCatalogQuery = {
    search: '',
    category: 'all',
    sortBy: 'title',
    sortDirection: 'asc',
    page: 1,
    pageSize: 6,
  };

  totalItems = 0;
  totalPages = 1;
  isLoading = false;
  errorMessage = '';

  ngOnInit(): void {
    this.categories = this.productService.getCategories();
    this.loadCatalog();
  }

  onFiltersChange(): void {
    this.query.page = 1;
    this.loadCatalog();
  }

  onPageChange(page: number): void {
    if (page < 1 || page > this.totalPages || page === this.query.page) {
      return;
    }

    this.query.page = page;
    this.loadCatalog();
  }

  trackById(_: number, product: ProductModel): string {
    return product.id;
  }

  private loadCatalog(): void {
    this.isLoading = true;
    this.errorMessage = '';

    this.productService.getCatalog(this.query).subscribe({
      next: (result: ProductCatalogResult) => {
        this.products = result.items;
        this.totalItems = result.totalItems;
        this.totalPages = result.totalPages;
        this.query.page = result.page;
        this.query.pageSize = result.pageSize;
        this.isLoading = false;
      },
      error: (error: unknown) => {
        this.errorMessage = error instanceof Error ? error.message : 'Erro ao carregar o catálogo.';
        this.products = [];
        this.isLoading = false;
      },
    });
  }
}
