import { Injectable, signal } from '@angular/core';
import { CartItem } from '../../../models/cartItem';
import { Product } from '../../../models/product';
@Injectable({
  providedIn: 'root',
})
export class Cart {
  //Estado inicial do carrinho, mutável apenas por ele mesmo.
  private cartItens = signal<CartItem[]>([]);

  //Retorna apenas os items do carrinho, para leitura
  getCartItens() {
    return this.cartItens.asReadonly();
  }

  //Adiciona um produto ao carrinho
  addCartItem(product: Product): void {
    this.cartItens.update((items) => {
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
}
