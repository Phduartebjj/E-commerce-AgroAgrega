import { Injectable, signal } from '@angular/core';
import { productsItems } from '../../data/products';
import { ProductCategory, ProductModel } from '../../../models/product';

@Injectable({
  providedIn: 'root',
})
export class ProductService {
  private products = signal<ProductModel[]>(productsItems);

  getProducts() {
    return this.products.asReadonly();
  }

  getProductCategories(): ProductCategory[] {
    return ['Agricultura de Precisão', 'Irrigação', 'Pecuária', 'Ferramentas', 'Insumos'];
  }
}
