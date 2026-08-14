import { computed, Injectable, signal } from '@angular/core';
import { CartItemModel } from '@models/cartItem';
import { ProductModel } from '@models/product';
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

  removeCartItem(product: ProductModel): void {
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

  //Por enquanto só joga os itens fora.
  cleanCartItem(): void {
    this.cartItems.set([]);
  }
  //calcula o valor total do carrinho
  total = computed(() => {
    return this.cartItems().reduce((total, item) => {
      return total + item.product.price * item.quantity;
    }, 0);
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
