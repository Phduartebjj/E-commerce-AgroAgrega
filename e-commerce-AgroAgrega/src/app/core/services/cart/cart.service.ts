import { computed, effect, Injectable, signal, PLATFORM_ID, inject } from '@angular/core';
import { CartItemModel } from '../../../models/cartItem';
import { isPlatformBrowser } from '@angular/common';
import { ProductModel } from '../../../models/product';
import { COUPONS } from '@core/data/coupons';
import { CouponModel } from '@models/coupon';
@Injectable({
  providedIn: 'root',
})
export class Cart {
  //Estado inicial do carrinho, mutável apenas por ele mesmo.
  private platformId = inject(PLATFORM_ID);
  private readonly chaveStorage = 'my-storage-cart';
  private cartItems = signal<CartItemModel[]>(this.getStorageCart());
  //Retorna apenas os items do carrinho, para leitura
  getCartItems() {
    return this.cartItems.asReadonly();
  }

  getStorageCart() {
    if (!this.isBrowser()) {
      return [];
    }
    const cartItems = localStorage.getItem(this.chaveStorage);
    if (!cartItems) {
      return [];
    }
    try {
      return JSON.parse(cartItems) as CartItemModel[];
    } catch {
      return [];
    }
  }

  updateStorageCart() {
    if (!this.isBrowser()) {
      return;
    }
    localStorage.setItem(this.chaveStorage, JSON.stringify(this.cartItems()));
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

  //Adiciona um produto ao carrinho
  addCartItem(product: ProductModel, quantity: number = 1): void {
    this.cartItems.update((items) => {
      //Encontra produto
      const productFind = items.find((p) => p.product.id === product.id);

      if (productFind) {
        //retorna um novo array baseado no carrinho, procura o produto e adiciona a quantidade
        return items.map((item) => {
          if (item.product.id === product.id) {
            return { ...item, quantity: item.quantity + quantity };
          }
          return item;
        });
      } else {
        //Se não encontrar, cria o produto.
        return [...items, { product: product, quantity: quantity }];
      }
    });
  }

  decreaseQuantity(product: ProductModel): void {
    this.cartItems.update((items) => {
      //Procura produto que vai ser removido no array
      const productFind = items.find((p) => p.product.id === product.id);

      //Remove o possível tipo undefined
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
  //Por enquanto só joga os itens fora.
  cleanCartItem(): void {
    this.cartItems.set([]);
  }
  //calcula o valor total do carrinho
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

  //calcula o total de produtos do carrinho
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
      if (!this.isBrowser()) {
        return;
      }
      this.updateStorageCart();
    });
  }

  private isBrowser(): boolean {
    return isPlatformBrowser(this.platformId);
  }
}
