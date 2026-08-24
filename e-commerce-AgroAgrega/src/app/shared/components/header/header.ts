import { Cart } from '@core/services/cart/cart.service';
import { Component, inject, Signal, signal } from '@angular/core';
import { Router, RouterLink,}  from '@angular/router';
import { Auth } from '@core/services/auth/auth.service';
import { FavoritesService } from '@core/services/favorites/favorites.service';
import { FavoritesComponent } from '../favorites/favorites.component';

@Component({
  selector: 'app-header',
  imports: [RouterLink, FavoritesComponent],
  templateUrl: './header.html',
  styleUrl: './header.css',
})
export class Header {
  private readonly cart = inject(Cart);
  private readonly favoritesService = inject(FavoritesService);
  private readonly autentication = inject(Auth);
  private readonly router = inject(Router);

  readonly favoritesOpen = signal(false);
  readonly favoritesCount = this.favoritesService.count;

  toggleFavorites(): void {
    if(!this.autentication.isLoggedIn()){
      this.router.navigateByUrl('/login');
      return;
    }

    this.favoritesOpen.update(
      open => !open
    );
  }

  closeFavorites(): void {
    this.favoritesOpen.set(false);
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