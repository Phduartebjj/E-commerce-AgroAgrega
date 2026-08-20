import { Injectable, signal } from '@angular/core';
import { productsItems } from '../../data/products';
import { ProductModel } from '../../../models/product';

@Injectable({
  providedIn: 'root',
})
export class ProductService {
  private products = signal<ProductModel[]>(productsItems);

  getProducts(): ProductModel[] {
    return this.products();
  }

  getProductCategories(): string[] {
    return ['Agricultura de Precisão', 'Irrigação', 'Pecuária', 'Ferramentas', 'Insumos'];
  }
}
