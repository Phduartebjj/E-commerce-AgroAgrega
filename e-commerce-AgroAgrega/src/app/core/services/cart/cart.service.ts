import { computed, effect, Injectable, signal, PLATFORM_ID, inject } from '@angular/core';
import { CartItemModel } from '../../../models/cartItem';
import { isPlatformBrowser } from '@angular/common';
import { ProductModel } from '../../../models/product';
import { COUPONS } from '@core/data/coupons';
import { CouponModel } from '@models/coupon';
import { Auth } from '../auth/auth.service';
@Injectable({
  providedIn: 'root',
})
export class Cart {
  private readonly guestCartKey = 'my-storage-cart-guest';
  private platformId = inject(PLATFORM_ID);
  private readonly keyStorage = 'my-storage-cart';
  private cartItems = signal<CartItemModel[]>([]);
  private readonly auth = inject(Auth);
  private initializedUserId: string | null | undefined = undefined;

  getCartItems() {
    return this.cartItems.asReadonly();
  }

  private getStorageKey(): string | null {
    const userId = this.auth.currentUserId();
    if (!userId) {
      return this.guestCartKey;
    }
    return `${this.keyStorage}-${userId}`;
  }

  getStorageCart() {
    if (!this.isBrowser()) {
      return [];
    }

    const key = this.getStorageKey();
    if (!key) {
      return [];
    }
    const cartItems = localStorage.getItem(key);
    if (!cartItems) {
      return [];
    }
    try {
      const parsedCartItems = JSON.parse(cartItems) as CartItemModel[];

      return parsedCartItems.map((item) => ({
        ...item,
        product: {
          ...item.product,
          images: item.product.images.map((image) =>
            image.replace(/\.(png|jpe?g|gif|bmp|tiff?|avif)(?=([?#]|$))/i, '.webp'),
          ),
        },
      }));
    } catch {
      return [];
    }
  }

  private migrateGuestCart(userId: string): void {
    if (!this.isBrowser()) {
      return;
    }

    const guestCart = localStorage.getItem(this.guestCartKey);

    if (!guestCart) {
      return;
    }

    const userCartKey = `${this.keyStorage}-${userId}`;
    const existingUserCart = localStorage.getItem(userCartKey);

    try {
      const guestItems = JSON.parse(guestCart) as CartItemModel[];

      const userItems = existingUserCart ? (JSON.parse(existingUserCart) as CartItemModel[]) : [];

      const mergedItems = [...userItems];

      for (const guestItem of guestItems) {
        const existingItem = mergedItems.find((item) => item.product.id === guestItem.product.id);

        if (existingItem) {
          existingItem.quantity += guestItem.quantity;
        } else {
          mergedItems.push(guestItem);
        }
      }

      localStorage.setItem(userCartKey, JSON.stringify(mergedItems));

      localStorage.removeItem(this.guestCartKey);
    } catch (error) {
      console.error('Erro ao migrar carrinho:', error);
    }
  }

  updateStorageCart() {
    if (!this.isBrowser()) {
      return;
    }

    const key = this.getStorageKey();
    if (!key) {
      return;
    }

    localStorage.setItem(key, JSON.stringify(this.cartItems()));
  }

  coupon = signal<CouponModel | null>(null);

  applyCoupon(couponCode: string): void {
    const coupon = couponCode.toUpperCase();
    const couponFind = COUPONS.find((c) => c.code === coupon);

    if (!couponFind) {
      this.coupon.set(null);
      this.removeCoupon();
      return;
    }

    this.coupon.set(couponFind);
  }

  subtotal = computed(() => {
    return this.cartItems().reduce((total, item) => {
      return total + item.product.price * item.quantity;
    }, 0);
  });

  removeCoupon(): void {
    this.coupon.set(null);
  }
  addCartItem(product: ProductModel, quantity: number = 1): void {
    this.cartItems.update((items) => {
      const productFind = items.find((p) => p.product.id === product.id);

      if (productFind) {

        return items.map((item) => {
          if (item.product.id === product.id) {
            return { ...item, quantity: item.quantity + quantity };
          }
          return item;
        });
      } else {

        return [...items, { product: product, quantity: quantity }];
      }
    });
  }

  decreaseQuantity(product: ProductModel): void {
    this.cartItems.update((items) => {

      const productFind = items.find((p) => p.product.id === product.id);

      if (!productFind) {
        return items;
      }

      return items.map((item) => {
        if (product.id === item.product.id) {
          return { ...item, quantity: item.quantity - 1 };
        }
        return item;
      });
    });
  }

  removeCartItem(product: ProductModel): void {
    this.cartItems.update((items) => {
      return items.filter((item) => item.product.id !== product.id);
    });
  }

  cleanCartItem(): void {
    this.cartItems.set([]);
  }

  total = computed(() => {
    let valorTotal = this.cartItems().reduce((total, item) => {
      return total + item.product.price * item.quantity;
    }, 0);

    const coupon = this.coupon();

    if (coupon) {
      valorTotal = valorTotal - (valorTotal * coupon!.discountPercentage) / 100;
    }
    return valorTotal;
  });

  discountValue = computed(() => {
    const discount = this.subtotal() - this.total();
    return discount > 0 ? discount : 0;
  });


  totalCartItens = computed(() => {
    return this.cartItems().reduce((total, item) => {
      return total + item.quantity;
    }, 0);
  });

  isEmpty = computed(() => {
    return this.cartItems().length === 0;
  });

  constructor() {
    effect(() => {
      const userId = this.auth.currentUserId();

      if (!this.isBrowser()) {
        return;
      }

      if (userId) {
        this.migrateGuestCart(userId);
      }

      this.cartItems.set(this.getStorageCart());

      this.initializedUserId = userId;
    });

    effect(() => {
      const userId = this.auth.currentUserId();
      const items = this.cartItems();

      if (!this.isBrowser()) {
        return;
      }

      if (this.initializedUserId !== userId) {
        return;
      }

      const key = this.getStorageKey();

      if (!key) {
        return;
      }

      localStorage.setItem(key, JSON.stringify(items));
    });
  }

  private isBrowser(): boolean {
    return isPlatformBrowser(this.platformId);
  }
}
