import { Cart } from '@core/services/cart/cart.service';
<<<<<<< HEAD
import { Component, inject, Signal, signal } from '@angular/core';
import { Router, RouterLink,}  from '@angular/router';
=======
import { Component, inject, InjectionToken, Signal, signal } from '@angular/core';
import { Router,RouterLink }  from '@angular/router';
>>>>>>> 973fc82a9e7d0ddc9c908c1624f07583ada78288
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
<<<<<<< HEAD
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


=======
 
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
>>>>>>> 973fc82a9e7d0ddc9c908c1624f07583ada78288
  totalItens =this.cart.totalCartItens;

  private auth = inject(Auth);

  public name: Signal<string> = signal(this.userName()).asReadonly();
  public loggedIn: Signal<boolean> = signal(this.auth.isLoggedIn()).asReadonly(); 

  private userName(): string{
    const name = this.auth.getName();
    return name !== '' ? `Olá, ${name.toUpperCase()}!` : 'Entrar ou Cadastrar';
  }
}