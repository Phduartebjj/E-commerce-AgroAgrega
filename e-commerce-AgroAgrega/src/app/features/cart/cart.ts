import { Component, inject } from '@angular/core';
import { Cart } from '../../core/services/cart/cart';
import { ProductModel } from '../../models/product';
import { PrecoFormatadoPipe } from '../../shared/pipes/preco-formatado-pipe';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-cart',
  imports: [RouterLink, PrecoFormatadoPipe],
  templateUrl: './cart.html',
  styleUrl: './cart.css',
})
export class CartComponent {
  private cart = inject(Cart);

  cartItems = this.cart.getCartItems();
  totalValue = this.cart.total;
  totalItens = this.cart.totalCartItens;
  isEmpty = this.cart.isEmpty;

  addProduct(product: ProductModel): void {
    this.cart.addCartItem(product);
  }

  removeProduct(product: ProductModel): void {
    this.cart.removeCartItem(product);
  }
}
