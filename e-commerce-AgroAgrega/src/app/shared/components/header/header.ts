import { Cart } from '@core/services/cart/cart.service';
import { Component, inject, Signal, signal } from '@angular/core';
import { RouterLink,}  from '@angular/router';
import { Auth } from '@core/services/auth/auth.service';

@Component({
  selector: 'app-header',
  imports: [RouterLink],
  templateUrl: './header.html',
  styleUrl: './header.css',
})
export class Header {
  private cart = inject(Cart);
  
  totalItens =this.cart.totalCartItens;

  private auth = inject(Auth);

  public name: Signal<string> = signal(this.userName()).asReadonly();
  public loggedIn: Signal<boolean> = signal(this.auth.isLoggedIn()).asReadonly(); 

  private userName(): string{
    const name = this.auth.getName();
    return name !== '' ? `Olá, ${name.toUpperCase()}!` : 'Entrar ou Cadastrar';
  }
}