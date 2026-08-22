import { Component, inject } from '@angular/core';
import{ RouterLink,}  from '@angular/router';
import { Cart } from '@core/services/cart/cart.service';

@Component({
  selector: 'app-header',
  imports: [RouterLink],
  templateUrl: './header.html',
  styleUrl: './header.css',
})
export class Header {
  private cart = inject(Cart);
  
  totalItens =this.cart.totalCartItens;
}

