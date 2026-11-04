import { Component, computed, inject, input, output, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { ProductModel } from '@models/product';
import { Cart } from '../../../core/services/cart/cart.service';
import { Auth } from '../../../core/services/auth/auth.service';
import { FavoritesService } from '../../../core/services/favorites/favorites.service';
import {
  calculateDiscountPercent,
  calculateInstallmentPrice,
} from '../../../shared/utils/product-card-display';

@Component({
  selector: 'app-offer-product-card',
  imports: [RouterLink],
  templateUrl: './offer-product-card.html',
  styleUrl: './offer-product-card.css',
  host: { '[class.offer-list-item]': 'listView()' },
})
export class OfferProductCardComponent {
  readonly product = input.required<ProductModel>();
  readonly listView = input(false);
  readonly compareSelected = input(false);
  readonly toggleCompare = output<ProductModel>();
  readonly added = output<ProductModel>();
  readonly cart = inject(Cart);
  readonly favorites = inject(FavoritesService);
  private readonly auth = inject(Auth);
  private readonly router = inject(Router);
  private readonly priceFormatter = new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  });
  readonly imageUnavailable = signal(false);
  readonly discount = computed(() =>
    calculateDiscountPercent(this.product().price, this.product().originalPrice),
  );
  readonly savings = computed(() =>
    Math.max(0, (this.product().originalPrice ?? this.product().price) - this.product().price),
  );
  readonly installment = computed(() => calculateInstallmentPrice(this.product().price));
  readonly stars = computed(() =>
    Array.from({ length: 5 }, (_, index) => index < Math.round(this.product().rating)),
  );
  readonly inCart = computed(() =>
    this.cart
      .getCartItems()()
      .some((item) => item.product.id === this.product().id),
  );

  addToCart(): void {
    this.cart.addCartItem(this.product());
    this.added.emit(this.product());
  }

  toggleFavorite(): void {
    if (!this.auth.isLoggedIn()) {
      void this.router.navigate(['/login']);
      return;
    }
    const product = this.product();
    this.favorites.toggle({
      id: product.id,
      name: product.title,
      category: product.category,
      price: product.price,
      image: product.images[0] ?? '',
    });
  }

  formatPrice(value: number): string {
    return this.priceFormatter.format(value);
  }
}
