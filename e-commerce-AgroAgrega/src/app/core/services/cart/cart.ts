import { Injectable, signal } from '@angular/core';
import { CartItem } from '@models/cartItem';
import { Product } from '@models/product';
@Injectable({
  providedIn: 'root',
})
export class Cart {
  //Estado inicial do carrinho, mutável apenas por ele mesmo.
  private cartItems = signal<CartItem[]>([]);

  //Retorna apenas os items do carrinho, para leitura
  getCartItems() {
    return this.cartItems.asReadonly();
  }

  //Adiciona um produto ao carrinho
  addCartItem(product: Product): void {
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

  removeCartItem(product: Product): void {
    this.cartItems.update((items) => {
      //Procura produto que vai ser removido no array
      const productFind = items.find((p) => p.product.id === product.id);

      //Remove o possível tipo undefined
      if (!productFind) {
        return items;
      }

      if (productFind.quantity <= 1) {
        //Tira o produto do carrinho caso ele seja o removido
        return items.filter((p) => p.product.id !== product.id);
      } else {
        //Se o produto for mais de um, cria um array novo em cima do antigo e remove a quantidade do produto.
        return items.map((item) => {
          if (product.id === item.product.id) {
            return { ...item, quantity: item.quantity - 1 };
          }

          return item;
        });
      }
    });
  }
}
