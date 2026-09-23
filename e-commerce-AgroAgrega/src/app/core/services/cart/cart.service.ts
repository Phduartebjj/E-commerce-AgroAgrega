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
  private selectedProductIds = signal<string[] | null>(null);
  readonly coupon = signal<CouponModel | null>(null);
  private readonly auth = inject(Auth);
  private initializedUserId: string | null | undefined = undefined;

  getCartItems() {
    return this.cartItems.asReadonly();
  }

  readonly selectedCartItems = computed(() => {
    const selectedIds = this.selectedProductIds();
    const items = this.cartItems();

    if (selectedIds === null) {
      return items;
    }

    const selection = new Set(selectedIds);
    return items.filter((item) => selection.has(item.product.id));
  });

  readonly selectedItemsCount = computed(() =>
    this.selectedCartItems().reduce((total, item) => total + item.quantity, 0),
  );

  readonly selectedSubtotal = computed(() =>
    this.selectedCartItems().reduce((total, item) => total + item.product.price * item.quantity, 0),
  );

  readonly selectedOriginalSubtotal = computed(() =>
    this.selectedCartItems().reduce(
      (total, item) => total + (item.product.originalPrice ?? item.product.price) * item.quantity,
      0,
    ),
  );

  readonly selectedProductDiscount = computed(() =>
    Math.max(0, this.selectedOriginalSubtotal() - this.selectedSubtotal()),
  );

  readonly selectedCouponDiscount = computed(() => {
    const coupon = this.coupon();
    return coupon ? (this.selectedSubtotal() * coupon.discountPercentage) / 100 : 0;
  });

  readonly selectedTotal = computed(() =>
    Math.max(0, this.selectedSubtotal() - this.selectedCouponDiscount()),
  );

  readonly selectedPixDiscount = computed(() => this.selectedTotal() * 0.1);

  readonly selectedPixTotal = computed(() =>
    Math.max(0, this.selectedTotal() - this.selectedPixDiscount()),
  );

  readonly allItemsSelected = computed(
    () =>
      this.cartItems().length > 0 && this.selectedCartItems().length === this.cartItems().length,
  );

  isProductSelected(productId: string): boolean {
    return this.selectedCartItems().some((item) => item.product.id === productId);
  }

  setProductSelected(productId: string, selected: boolean): void {
    const ids = new Set(this.selectedCartItems().map((item) => item.product.id));

    if (selected) {
      ids.add(productId);
    } else {
      ids.delete(productId);
    }

    this.selectedProductIds.set([...ids]);
  }

  setProductsSelected(productIds: string[], selected: boolean): void {
    const ids = new Set(this.selectedCartItems().map((item) => item.product.id));

    for (const productId of productIds) {
      if (selected) {
        ids.add(productId);
      } else {
        ids.delete(productId);
      }
    }

    this.selectedProductIds.set([...ids]);
  }

  selectAllItems(selected: boolean): void {
    this.selectedProductIds.set(selected ? null : []);
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
          images: item.product.images.map((image) => {
            let img = image.replace(/\.(png|jpe?g|gif|bmp|tiff?|avif)(?=([?#]|$))/i, '.webp');
            if (!img.startsWith('/') && !img.startsWith('http')) {
              img = '/' + img;
            }
            return img;
          }),
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

    const selection = this.selectedProductIds();
    if (selection !== null && !selection.includes(product.id)) {
      this.selectedProductIds.set([...selection, product.id]);
    }
  }

  setItemQuantity(productId: string, quantity: number): boolean {
    if (!Number.isSafeInteger(quantity) || quantity < 1 || quantity > 99) return false;
    if (!this.cartItems().some((item) => item.product.id === productId)) return false;

    this.cartItems.update((items) =>
      items.map((item) =>
        item.product.id === productId ? { ...item, quantity } : item,
      ),
    );
    return true;
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
    this.selectedProductIds.set(null);
  }

  removeSelectedItems(): void {
    const selectedIds = new Set(this.selectedCartItems().map((item) => item.product.id));
    this.cartItems.update((items) => items.filter((item) => !selectedIds.has(item.product.id)));
    this.selectedProductIds.set(null);
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
