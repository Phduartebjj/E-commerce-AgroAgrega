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
  isEmpty = this.cart.isEmpty;

  addProduct(product: ProductModel): void {
    this.cart.addCartItem(product);
  }

  item: ProductModel = {
    id: '1',
    title: 'Produto 1',
    price: 10.0,
    description: 'Descrição do Produto 1',
    images: ['https://via.placeholder.com/150'],
    category: 'Categoria 1',
  };

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

  clearCart(): void {
    this.cart.cleanCartItem();
  }
}