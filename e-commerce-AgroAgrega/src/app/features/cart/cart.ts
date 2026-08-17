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

  item: ProductModel = {
    id: '1',
    title: 'Kit Estação Meteorológica Inteligente AgroSense Pro',
    price: 2899.9,
    description: 'Kit completo • Wi-Fi + 4G',
    images: ['https://placehold.co/80x80?font=roboto'],
    category: 'AGRICULTURA DE PRECISÃO',
  };

  item2: ProductModel = {
    id: '2',
    title: 'Mangueira de gotejamento resistente 100 m',
    price: 439.8,
    description: 'Em estoque • envio imediato',
    images: ['https://placehold.co/80x80?font=roboto'],
    category: 'IRRIGAÇÃO',
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
