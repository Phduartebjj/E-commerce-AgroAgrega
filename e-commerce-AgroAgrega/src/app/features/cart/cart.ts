import { Component, inject } from '@angular/core';
import { Cart } from '../../core/services/cart/cart.service';
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
  subTotal = this.cart.subtotal;
  isEmpty = this.cart.isEmpty;
  discountValue = this.cart.discountValue;

  addProduct(product: ProductModel): void {
    this.cart.addCartItem(product);
  }

  applyCoupon(couponCode: string): void {
    this.cart.applyCoupon(couponCode);
    console.log('Cupom aplicado:', couponCode);
  }

  removeCoupon(): void {
    this.cart.removeCoupon();
  }

  removeProduct(product: ProductModel): void {
    this.cart.removeCartItem(product);
  }

  decreaseProductQuantity(product: ProductModel): void {
    this.cart.decreaseQuantity(product);
  }

  cleanInputValue(input: HTMLInputElement): void {
    input.value = '';
  }

  clearCart(): void {
    this.cart.cleanCartItem();
  }
}
