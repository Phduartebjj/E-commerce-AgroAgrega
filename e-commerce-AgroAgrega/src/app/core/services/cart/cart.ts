import { Injectable, signal } from '@angular/core';
import { CartItem } from '../../../models/cartItem';
@Injectable({
  providedIn: 'root',
})
export class Cart {
  private cartItens = signal<CartItem[]>([]);

  getCartItens() {
    return this.cartItens.asReadonly();
  }
}
