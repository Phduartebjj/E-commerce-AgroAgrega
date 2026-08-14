import { TestBed } from '@angular/core/testing';
import { Cart } from './cart';
import { Product } from '@models/product';

describe.only('Cart', () => {
  let service: Cart;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(Cart);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  const product1: Product = {
    id: '1',
    title: 'Produto Teste',
    price: 10,
    description: 'Produto utilizado nos testes',
    category: 'teste',
    images: [],
  };
  it('deve adicionar um produto ao carrinho', () => {
    service.addCartItem(product1);
    const items = service.getCartItems()();
    expect(items.length).toBe(1);
    expect(items[0].product).toEqual(product1);
    expect(items[0].quantity).toBe(1);
  });

  it('deve remover um produto do carrinho', () => {
    service.addCartItem(product1);
    service.removeCartItem(product1);
    const cartItems = service.getCartItems()();
    expect(cartItems.length).toBe(0);
  });

  it('Deve remover uma quantidade do produto', () => {
    service.addCartItem(product1);
    service.addCartItem(product1);
    service.removeCartItem(product1);
    const cartItems = service.getCartItems()();
    expect(cartItems.length).toBe(1);
    expect(cartItems[0].product).toEqual(product1);
    expect(cartItems[0].quantity).toBe(1);
  });

  it('Deve adicionar duas quantidades do produto', () => {
    service.addCartItem(product1);
    service.addCartItem(product1);
    const cartItems = service.getCartItems()();
    expect(cartItems.length).toBe(1);
    expect(cartItems[0].product).toEqual(product1);
    expect(cartItems[0].quantity).toBe(2);
  });

  it('Deve deixar o carrinho vazio', () => {
    service.addCartItem(product1);
    service.cleanCartItem();
    const cartItems = service.getCartItems()();
    expect(cartItems.length).toBe(0);
  });

  it('Deve atualizar o total ao adicionar um produto', () => {
    expect(service.total()).toBe(0);

    service.addCartItem(product1);

    expect(service.total()).toBe(10);

    service.addCartItem(product1);

    expect(service.total()).toBe(20);
  });

  it('Deve atualizar o total ao remover um produto', () => {
    service.addCartItem(product1);
    service.addCartItem(product1);
    expect(service.total()).toBe(20);
    service.removeCartItem(product1);
    expect(service.total()).toBe(10);
    service.removeCartItem(product1);
    expect(service.total()).toBe(0);
  });

  it('Deve atualizar a quantidade total de itens no carrinho ao adicionar', () => {
    expect(service.totalCartItens()).toBe(0);
    service.addCartItem(product1);
    expect(service.totalCartItens()).toBe(1);
    service.addCartItem(product1);
    expect(service.totalCartItens()).toBe(2);
  });

  it('Deve atualizar a quantidade total de itens no carrinho ao adicionar', () => {
    service.addCartItem(product1);
    service.addCartItem(product1);
    expect(service.totalCartItens()).toBe(2);
    service.removeCartItem(product1);
    expect(service.totalCartItens()).toBe(1);
    service.removeCartItem(product1);
    expect(service.totalCartItens()).toBe(0);
  });
});
