import { ProductModel } from './product';

export interface CartItemModel {
  product: ProductModel;
  quantity: number;
}
