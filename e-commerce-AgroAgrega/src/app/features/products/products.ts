import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

import { ProductService } from '../../core/services/product/product';
import { Product } from '../../models/product';

interface ProductFormValue {
  title: string;
  price: number;
  description: string;
  category: string;
  stock: number;
  images: string;
}

@Component({
  selector: 'app-products',
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './products.html',
  styleUrl: './products.css',
})
export class Products {
  private readonly productService = inject(ProductService);

  readonly products = this.productService.products;
  readonly pageSize = 6;

  readonly searchTerm = signal('');
  readonly selectedCategory = signal('all');
  readonly currentPage = signal(1);

  editingProductId: string | null = null;

  readonly categories = computed(() =>
    [...new Set(this.products().map((product) => product.category))]
      .filter((category) => category.length > 0)
      .sort((a, b) => a.localeCompare(b)),
  );

  readonly filteredProducts = computed(() => {
    const term = this.searchTerm().trim().toLocaleLowerCase();
    const category = this.selectedCategory();

    return this.products().filter((product) => {
      const matchesCategory = category === 'all' || product.category === category;
      if (!matchesCategory) {
        return false;
      }

      if (!term) {
        return true;
      }

      return (
        product.title.toLocaleLowerCase().includes(term) ||
        product.description.toLocaleLowerCase().includes(term) ||
        product.category.toLocaleLowerCase().includes(term)
      );
    });
  });

  readonly totalPages = computed(() => Math.max(1, Math.ceil(this.filteredProducts().length / this.pageSize)));

  readonly paginatedProducts = computed(() => {
    const safePage = Math.min(this.currentPage(), this.totalPages());
    const start = (safePage - 1) * this.pageSize;
    return this.filteredProducts().slice(start, start + this.pageSize);
  });

  form: ProductFormValue = this.getEmptyForm();

  applySearchTerm(value: string): void {
    this.searchTerm.set(value);
    this.currentPage.set(1);
  }

  applyCategory(value: string): void {
    this.selectedCategory.set(value);
    this.currentPage.set(1);
  }

  setPage(page: number): void {
    if (page < 1 || page > this.totalPages()) {
      return;
    }

    this.currentPage.set(page);
  }

  startEditing(product: Product): void {
    this.editingProductId = product.id;
    this.form = {
      title: product.title,
      price: product.price,
      description: product.description,
      category: product.category,
      stock: product.stock,
      images: product.images.join(', '),
    };
  }

  cancelEditing(): void {
    this.editingProductId = null;
    this.form = this.getEmptyForm();
  }

  saveProduct(): void {
    const payload = this.getValidatedFormValue();
    if (!payload) {
      return;
    }

    if (this.editingProductId) {
      this.productService.updateProduct(this.editingProductId, payload);
    } else {
      this.productService.createProduct(payload);
    }

    this.cancelEditing();
  }

  deleteProduct(productId: string): void {
    this.productService.deleteProduct(productId);
    if (this.currentPage() > this.totalPages()) {
      this.currentPage.set(this.totalPages());
    }
  }

  private getValidatedFormValue(): Omit<Product, 'id'> | null {
    const title = this.form.title.trim();
    const description = this.form.description.trim();
    const category = this.form.category.trim();
    const price = Number(this.form.price);
    const stock = Number(this.form.stock);

    if (!title || !description || !category || !Number.isFinite(price) || !Number.isFinite(stock)) {
      return null;
    }

    if (price < 0 || stock < 0) {
      return null;
    }

    const images = this.form.images
      .split(',')
      .map((image) => image.trim())
      .filter((image) => image.length > 0);

    return {
      title,
      description,
      category,
      price,
      stock,
      images,
    };
  }

  private getEmptyForm(): ProductFormValue {
    return {
      title: '',
      price: 0,
      description: '',
      category: '',
      stock: 0,
      images: '',
    };
  }
}
