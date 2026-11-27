import { Component, inject, signal, HostListener } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { Cart } from '@core/services/cart/cart.service';
import { Auth } from '@core/services/auth/auth.service';
import { AvatarService } from '@core/services/avatar/avatar.service';
import { FavoritesService } from '@core/services/favorites/favorites.service';
import { FavoritesComponent } from '../favorites/favorites.component';

@Component({
  selector: 'app-header',
  imports: [RouterLink],
  templateUrl: './header.html',
  styleUrl: './header.css',
})
export class Header {
  private readonly router = inject(Router);
  private readonly cart = inject(Cart);
  private readonly favoritesService = inject(FavoritesService);
  private readonly auth = inject(Auth);
  readonly avatar = inject(AvatarService);

  readonly favoritesOpen = signal(false);
  readonly accountMenuOpen = signal(false);
  readonly favoritesCount = this.favoritesService.count;

  readonly totalItens = this.cart.totalCartItens;

  public name(): string {
    return this.userName();
  }

  public loggedIn(): boolean {
    return this.auth.isLoggedIn();
  }

  public accountName(): string {
    return this.auth.getName();
  }

  public accountEmail(): string {
    return this.auth.getEmail();
  }

  toggleAccountMenu(event: MouseEvent): void {
    event.stopPropagation();
    this.accountMenuOpen.update((open) => !open);
  }

  closeAccountMenu(): void {
    this.accountMenuOpen.set(false);
  }

  @HostListener('document:click')
  closeAccountMenuOnOutsideClick(): void {
    this.closeAccountMenu();
  }

  @HostListener('document:keydown.escape')
  closeAccountMenuOnEscape(): void {
    this.closeAccountMenu();
  }

  logout(): void {
    this.closeAccountMenu();
    this.auth.logout();
    this.router.navigateByUrl('/');
  }

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

    this.favoritesOpen.update((open) => !open);
  }

  closeFavorites(): void {
    this.favoritesOpen.set(false);
  }

  private userName(): string {
    const name = this.auth.getName();
    return name !== '' ? `Olá, ${name.toUpperCase()}!` : 'Entrar ou Cadastrar';
  }
}
