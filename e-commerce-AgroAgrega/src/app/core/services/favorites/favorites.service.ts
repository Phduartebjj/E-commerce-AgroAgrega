import { inject, Injectable, signal } from '@angular/core';
import { FavoriteProduct } from '@models/favorite';
import { Auth } from '../auth/auth.service';

@Injectable({
  providedIn: 'root'
})
export class FavoritesService {

  private auth = inject(Auth);
  
  readonly favorites = signal<FavoriteProduct[]>([]);
  readonly count = () => this.favorites().length;
  
  isFavorite(id: number): boolean {
    return this.favorites().some(product => product.id === id);
  }

  add(product: FavoriteProduct): void {
    if(!this.auth.isLoggedIn()) return;

    if (this.isFavorite(product.id)) {
      return;
    }

    this.favorites.update(products => [
      ...products,
      product
    ]);
  }

  remove(id: number): void {
    this.favorites.update(products =>
      products.filter(product => product.id !== id)
    );
  }

  toggle(product: FavoriteProduct): void {
    if (this.isFavorite(product.id)) {
      this.remove(product.id);
    } else {
      this.add(product);
    }
  }

  clear(): void {
    this.favorites.set([]);
  }
}