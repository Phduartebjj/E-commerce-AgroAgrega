import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { vi } from 'vitest';

import { ProductCardComponent } from './product-card';
import { ProductModel } from '../../../models/product';

describe('ProductCardComponent', () => {
  let component: ProductCardComponent;
  let fixture: ComponentFixture<ProductCardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProductCardComponent],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(ProductCardComponent);
    component = fixture.componentInstance;
    const product: ProductModel = {
      id: '1',
      title: 'Produto de teste',
      price: 10,
      description: 'Descricao de teste',
      category: 'Insumos',
      images: [],
      rating: 5,
      weeklySales: 42,
    };
    fixture.componentRef.setInput('product', product);
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should emit the product when comparison is toggled', () => {
    const emitSpy = vi.spyOn(component.toggleCompare, 'emit');
    fixture.detectChanges();
    const host = fixture.nativeElement as HTMLElement;

    host.querySelector<HTMLButtonElement>('.compare-toggle')?.click();

    expect(emitSpy).toHaveBeenCalledTimes(1);
    expect(emitSpy).toHaveBeenCalledWith(component.product());
  });

  it('should expose the selected comparison state accessibly', () => {
    fixture.componentRef.setInput('compareSelected', true);
    fixture.detectChanges();
    const host = fixture.nativeElement as HTMLElement;

    const compareButton = host.querySelector<HTMLButtonElement>('.compare-toggle');

    expect(compareButton?.getAttribute('aria-pressed')).toBe('true');
    expect(compareButton?.textContent).toContain('Selecionado');
  });

  it('should highlight a promotional product and show its previous price', () => {
    fixture.componentRef.setInput('product', {
      ...component.product(),
      price: 80,
      originalPrice: 100,
    });
    fixture.detectChanges();
    const host = fixture.nativeElement as HTMLElement;

    expect(host.querySelector('.product-card-tag')?.textContent).toContain('Oferta −20%');
    expect(host.querySelector('.product-card-discount-line s')?.textContent).toContain('R$ 100.00');
  });

  it('should replace the cart button with detailed purchase information', () => {
    fixture.detectChanges();
    const host = fixture.nativeElement as HTMLElement;

    expect(host.querySelector('.product-card-button')).toBeNull();
    expect(host.querySelector('.product-card-pix')?.textContent).toContain('R$ 9.00');
    expect(host.querySelector('.product-card-installment')?.textContent).toContain('R$ 1.00');
    expect(host.querySelector('.product-card-main-price small')?.textContent).toContain(
      '42 vendidos nesta semana',
    );
    expect(host.querySelector('.product-card-full-label')?.textContent).toContain('FULL');
    expect(host.querySelector('.product-card-delivery')?.textContent).toContain('Chega grátis');
  });
});
