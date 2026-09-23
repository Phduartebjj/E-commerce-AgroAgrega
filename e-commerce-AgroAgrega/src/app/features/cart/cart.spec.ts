import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CartComponent } from './cart';
import { provideRouter, RouterLink } from '@angular/router';
import { PrecoFormatadoPipe } from '../../shared/pipes/preco-formatado-pipe';
import { Cart } from '../../core/services/cart/cart.service';
import { ProductModel } from '../../models/product';

// Verifica a renderização do carrinho, a seleção e o resumo reativo.
describe('CartComponent', () => {
  let component: CartComponent;
  let fixture: ComponentFixture<CartComponent>;
  let cart: Cart;

  const product: ProductModel = {
    id: 'cart-product',
    title: 'Sensor Agrícola',
    price: 100,
    originalPrice: 120,
    description: 'Sensor para monitoramento da lavoura',
    category: 'Ferramentas',
    weeklySales: 28,
    brand: 'AgroSense',
    rating: 4.8,
    images: ['/assets/images/generated-products/product-001.webp'],
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CartComponent, RouterLink, PrecoFormatadoPipe],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(CartComponent);
    component = fixture.componentInstance;
    cart = TestBed.inject(Cart);
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should render cart selection, sharing and reactive summary actions', () => {
    cart.addCartItem(product);
    fixture.detectChanges();

    const host = fixture.nativeElement as HTMLElement;
    expect(host.querySelector('.cart-toolbar')).toBeTruthy();
    expect(host.querySelector('.share-cart')?.textContent).toContain('Compartilhar carrinho');
    expect(host.querySelector('.cart-group__header')?.textContent).toContain('AgroSense');
    expect(host.querySelector<HTMLImageElement>('.partner-store-logo')?.getAttribute('src')).toBe(
      '/assets/images/partner-stores/agrosense.png',
    );
    expect(host.querySelector('.checkout-button')?.textContent).toContain('Continuar (1)');

    component.toggleProduct(product.id, false);
    fixture.detectChanges();

    expect(component.selectedItemsCount()).toBe(0);
    expect(host.querySelector('.nothing-selected')).toBeTruthy();
    expect(host.querySelector('.checkout-button')?.classList).toContain(
      'checkout-button--disabled',
    );
  });

  it('deve encaminhar ações do carrinho para o serviço', () => {
    const product: ProductModel = {
      id: 'product-1',
      title: 'Produto',
      price: 10,
      description: 'Descrição',
      category: 'Ferramentas',
      weeklySales: 1,
      rating: 4,
      images: [],
    };
    const input = document.createElement('input');
    input.value = '2';

    component.addProduct(product);
    component.applyCoupon('BEMVINDO10');
    component.decreaseProductQuantity(product);
    component.removeProduct(product);
    component.cleanInputValue(input);
    component.clearCart();
    component.removeCoupon();

    expect(input.value).toBe('');
    expect(component.cartItems()).toEqual([]);
  });
});
