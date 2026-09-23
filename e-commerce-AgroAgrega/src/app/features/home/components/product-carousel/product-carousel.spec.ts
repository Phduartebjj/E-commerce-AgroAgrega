import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { ProductCarousel } from './product-carousel';
import { ProductModel } from '@models/product';

describe('ProductCarousel', () => {
  let component: ProductCarousel;
  let fixture: ComponentFixture<ProductCarousel>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProductCarousel],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(ProductCarousel);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('produtos', []);
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should show detailed pricing without an add-to-cart button', () => {
    const product: ProductModel = {
      id: 'home-product',
      title: 'Produto em destaque',
      price: 100,
      originalPrice: 125,
      description: 'Produto para teste da vitrine',
      category: 'Insumos',
      images: ['produto.webp'],
      rating: 4.8,
      weeklySales: 87,
    };
    fixture.componentRef.setInput('produtos', [product]);
    fixture.detectChanges();
    const host = fixture.nativeElement as HTMLElement;

    expect(host.querySelector('.add-cart-button')).toBeNull();
    expect(host.querySelector('.product-discount')?.textContent).toContain('20% OFF');
    expect(host.querySelector('.product-pix')?.textContent).toContain('R$ 90.00');
    expect(host.querySelector('.product-installment')?.textContent).toContain('R$ 10.00');
    expect(host.querySelector('.product-main-price small')?.textContent).toContain(
      '87 vendidos nesta semana',
    );
    expect(host.querySelector('.product-full-label')?.textContent).toContain('FULL');
    expect(host.querySelector('.product-coupon')?.textContent).toContain('10% OFF no Pix');
  });
});
