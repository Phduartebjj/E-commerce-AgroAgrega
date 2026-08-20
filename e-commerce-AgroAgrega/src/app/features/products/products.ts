import { Component, inject } from '@angular/core';

import { ProductService } from '../../core/services/product/product.service';

@Component({
  selector: 'app-products',
  imports: [],
  templateUrl: './products.html',
  styleUrl: './products.css',
})
export class Products {
  private readonly productService = inject(ProductService);

  readonly products = this.productService.getProducts();
  readonly productCategories = this.productService.getProductCategories();
}

export type ProductCategory =
  'Agricultura de Precisão' | 'Irrigação' | 'Pecuária' | 'Ferramentas' | 'Insumos';

import { Injectable, signal } from '@angular/core';
import { productsItems } from '../../data/products';
import { ProductCategory, ProductModel } from '../../../models/product';

@Injectable({
  providedIn: 'root',
})
export class ProductService {
  private products = signal<ProductModel[]>(productsItems);

  getProducts(): ProductModel[] {
    return this.products();
  }

  getProductCategories(): ProductCategory[] {
    return [
      'Agricultura de Precisão',
      'Irrigação',
      'Pecuária',
      'Ferramentas',
      'Insumos',
    ];
  }
}
