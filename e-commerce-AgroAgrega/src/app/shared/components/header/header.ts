import { Cart } from '@core/services/cart/cart.service';
import { Component, inject, InjectionToken, Signal, signal } from '@angular/core';
import { Router,RouterLink }  from '@angular/router';
import { Auth } from '@core/services/auth/auth.service';

@Component({
  selector: 'app-header',
  imports: [RouterLink],
  templateUrl: './header.html',
  styleUrl: './header.css',
})
export class Header {
 
  private router = inject(Router)
  private cart = inject(Cart);
  
  buscarProdutos(termo: string): void {
  const search = termo.trim();

  if (!search) {
    this.router.navigate(['/products']);
    return;
  }

  this.router.navigate(['/products'], {
    queryParams: { search: search },
  });
}
  totalItens =this.cart.totalCartItens;

  private auth = inject(Auth);

  public name: Signal<string> = signal(this.userName()).asReadonly();
  public loggedIn: Signal<boolean> = signal(this.auth.isLoggedIn()).asReadonly(); 

  private userName(): string{
    const name = this.auth.getName();
    return name !== '' ? `Olá, ${name.toUpperCase()}!` : 'Entrar ou Cadastrar';
  }
}