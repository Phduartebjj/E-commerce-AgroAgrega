import { computed, Injectable, signal } from '@angular/core';
import { CartItemModel } from '../../../models/cartItem';
import { ProductModel } from '../../../models/product';
import { COUPONS } from '@core/data/coupons';
import { CouponModel } from '@models/coupon';
@Injectable({
  providedIn: 'root',
})
export class Cart {
  //Estado inicial do carrinho, mutável apenas por ele mesmo.
  private cartItems = signal<CartItemModel[]>([]);

  //Retorna apenas os items do carrinho, para leitura
  getCartItems() {
    return this.cartItems.asReadonly();
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

  

  removeCoupon(): void {
    this.coupon.set(null);
  }

  //Adiciona um produto ao carrinho
  addCartItem(product: ProductModel): void {
    this.cartItems.update((items) => {
      //Encontra produto
      const productFind = items.find((p) => p.product.id === product.id);

      if (productFind) {
        //retorna um novo array baseado no carrinho, procura o produto e adiciona a quantidade
        return items.map((item) => {
          if (item.product.id === product.id) {
            return { ...item, quantity: item.quantity + 1 };
          }
          return item;
        });
      } else {
        //Se não encontrar, cria o produto.
        return [...items, { product: product, quantity: 1 }];
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

  //calcula o total de produtos do carrinho
  totalCartItens = computed(() => {
    return this.cartItems().reduce((total, item) => {
      return total + item.quantity;
    }, 0);
  });

  isEmpty = computed(() => {
    return this.cartItems().length === 0;
  });
}
