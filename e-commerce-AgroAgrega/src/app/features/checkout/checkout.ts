import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Cart } from '../../core/services/cart/cart.service';
import { inject } from '@angular/core';
import { PrecoFormatadoPipe } from '../../shared/pipes/preco-formatado-pipe';

@Component({
  selector: 'app-checkout',
  imports: [RouterLink, PrecoFormatadoPipe],
  templateUrl: './checkout.html',
  styleUrl: './checkout.css',
})
export class Checkout {
  private cart = inject(Cart);

  totalValue = this.cart.total;
  subTotal = this.cart.subtotal;
  discountValue = this.cart.discountValue;

  
}
