import { Component, inject } from '@angular/core';
import { Cart } from '@core/services/cart/cart';
import { ProductModel } from '@models/product';
import { PrecoFormatadoPipe } from 'src/app/shared/pipes/preco-formatado-pipe';

@Component({
  selector: 'app-cart',
  imports: [],
  templateUrl: './cart.html',
  styleUrl: './cart.css',
})
export class CartComponent {
  private cart = inject(Cart);

  cartItems = this.cart.getCartItems();
  totalValue = this.cart.total;
  totalItens = this.cart.totalCartItens;
  isEmpty = this.cart.isEmpty;

  addProduct = this.cart.addCartItem;
}
