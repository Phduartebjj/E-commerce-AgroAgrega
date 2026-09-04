import { Component, inject, Signal, signal, HostListener } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { Cart } from '@core/services/cart/cart.service';
import { Auth } from '@core/services/auth/auth.service';
import { FavoritesService } from '@core/services/favorites/favorites.service';
import { FavoritesComponent } from '../favorites/favorites.component';

@Component({
  selector: 'app-header',
  imports: [RouterLink],
  templateUrl: './header.html',
  styleUrl: './header.css',
})
export class Header {

  navegacaoFixa = signal(false);

  
  @HostListener('window:scroll')
aoRolarPagina(): void {
  const rotaAtual = this.router.url.split('?')[0];

  const estaNoCatalogo = rotaAtual === '/products';

  this.navegacaoFixa.set(
    estaNoCatalogo && window.scrollY > 180
  );
}

  private readonly router = inject(Router);
  private readonly cart = inject(Cart);
  private readonly favoritesService = inject(FavoritesService);
  private readonly auth = inject(Auth);

  readonly favoritesOpen = signal(false);
  readonly favoritesCount = this.favoritesService.count;

  readonly totalItens = this.cart.totalCartItens;

  public name: Signal<string> = signal(this.userName()).asReadonly();
  public loggedIn: Signal<boolean> = signal(
    this.auth.isLoggedIn()
  ).asReadonly();

  buscarProdutos(termo: string): void {
    const search = termo.trim();

    if (!search) {
      this.router.navigate(['/products']);
      return;
    }

    this.router.navigate(['/products'], {
      queryParams: { search },
    });
  }

  toggleFavorites(): void {
    if (!this.auth.isLoggedIn()) {
      this.router.navigateByUrl('/login');
      return;
    }

    this.favoritesOpen.update(open => !open);
  }

  closeFavorites(): void {
    this.favoritesOpen.set(false);
  }

  private userName(): string {
    const name = this.auth.getName();
    return name !== '' ? `Olá, ${name.toUpperCase()}!` : 'Entrar ou Cadastrar';
  }
}
