import { TestBed } from '@angular/core/testing';
import { Cart } from './cart.service';
import { ProductModel } from '../../../models/product';

// Verifica as operações do carrinho, seus totais, cupons e itens selecionados.
describe('Cart', () => {
  let service: Cart;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(Cart);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  const product1: ProductModel = {
    id: '1',
    title: 'Produto Teste',
    price: 10,
    description: 'Produto utilizado nos testes',
    category: 'Ferramentas',
    weeklySales: 2,
    brand: 'Biomatrix',
    rating: 5,
    images: [],
  };
  const product2: ProductModel = {
    ...product1,
    id: '2',
    title: 'Produto em oferta',
    price: 20,
    originalPrice: 25,
    brand: 'AgroSense',
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
    service.decreaseQuantity(product1);
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

  it('deve ajustar a quantidade sem criar itens negativos ou acima do limite', () => {
    service.addCartItem(product1);

    expect(service.setItemQuantity(product1.id, 3)).toBe(true);
    expect(service.getCartItems()()[0].quantity).toBe(3);
    expect(service.setItemQuantity(product1.id, 0)).toBe(false);
    expect(service.setItemQuantity(product1.id, 100)).toBe(false);
    expect(service.setItemQuantity('inexistente', 2)).toBe(false);
    expect(service.getCartItems()()[0].quantity).toBe(3);
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
    service.decreaseQuantity(product1);
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
    service.decreaseQuantity(product1);
    expect(service.totalCartItens()).toBe(1);
    service.removeCartItem(product1);
    expect(service.totalCartItens()).toBe(0);
  });

  it('Deve mostrar que o carrinho está vazio', () => {
    service.addCartItem(product1);
    expect(service.isEmpty()).toBe(false);
    service.removeCartItem(product1);
    expect(service.isEmpty()).toBe(true);
  });

  it('Deve aplicar um cupom de desconto', () => {
    const couponCode = 'BEMVINDO10';
    service.addCartItem(product1);
    service.applyCoupon(couponCode);
    expect(service.coupon()).toEqual({ code: couponCode, discountPercentage: 10 });
    expect(service.total()).toBe(9);
  });

  it('Deve remover o cupom de desconto', () => {
    const couponCode = 'BEMVINDO10';
    service.addCartItem(product1);
    service.applyCoupon(couponCode);
    expect(service.coupon()).toEqual({ code: couponCode, discountPercentage: 10 });
    service.removeCoupon();
    expect(service.coupon()).toBeNull();
    expect(service.total()).toBe(10);
  });
  it('deve calcular o resumo somente com os produtos selecionados', () => {
    service.addCartItem(product1);
    service.addCartItem(product2);
    service.setProductSelected(product1.id, false);
    service.applyCoupon('BEMVINDO10');

    expect(service.selectedItemsCount()).toBe(1);
    expect(service.selectedSubtotal()).toBe(20);
    expect(service.selectedOriginalSubtotal()).toBe(25);
    expect(service.selectedProductDiscount()).toBe(5);
    expect(service.selectedCouponDiscount()).toBe(2);
    expect(service.selectedTotal()).toBe(18);
    expect(service.selectedPixDiscount()).toBeCloseTo(1.8);
    expect(service.selectedPixTotal()).toBeCloseTo(16.2);
  });

  it('deve remover após a compra apenas os produtos selecionados', () => {
    service.addCartItem(product1);
    service.addCartItem(product2);
    service.setProductSelected(product1.id, false);

    service.removeSelectedItems();

    expect(service.getCartItems()()).toEqual([{ product: product1, quantity: 1 }]);
    expect(service.allItemsSelected()).toBe(true);
  });

  it('Deve ignorar cupom inválido e calcular desconto', () => {
    service.addCartItem(product1, 3);
    service.applyCoupon('cupom-inexistente');

    expect(service.coupon()).toBeNull();
    expect(service.subtotal()).toBe(30);
    expect(service.discountValue()).toBe(0);

    service.applyCoupon('bemvindo10');
    expect(service.total()).toBe(27);
    expect(service.discountValue()).toBe(3);
  });

  it('Deve preservar quantidade ao adicionar e não alterar produto ausente', () => {
    service.addCartItem(product1, 3);
    service.addCartItem(product1, 2);
    expect(service.getCartItems()()[0].quantity).toBe(5);

    const otherProduct = { ...product1, id: '2' };
    service.decreaseQuantity(otherProduct);
    expect(service.getCartItems()()[0].quantity).toBe(5);
  });
});
