import { ComponentFixture, TestBed } from '@angular/core/testing';
import { vi } from 'vitest';
import { ProductModel } from '@models/product';
import { ProductComparisonComponent } from './product-comparison';

describe('ProductComparisonComponent', () => {
  let fixture: ComponentFixture<ProductComparisonComponent>;
  let component: ProductComparisonComponent;
  const product = (id: string, price: number): ProductModel => ({
    id,
    price,
    title: `Produto ${id}`,
    description: '',
    category: 'Irrigação',
    images: [],
    rating: 4.5,
  });

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProductComparisonComponent],
    }).compileComponents();
    fixture = TestBed.createComponent(ProductComparisonComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('products', [
      product('a', 329.9),
      product('b', 249.9),
      product('c', 239.9),
    ]);
    await fixture.whenStable();
  });

  it('highlights the actual lowest price and updates when the selection changes', () => {
    expect(component.lowestPriceId()).toBe('c');
    fixture.componentRef.setInput('products', [product('a', 329.9), product('b', 249.9)]);
    expect(component.lowestPriceId()).toBe('b');
    expect(component.formatPrice(1234.5).replace(/\s/g, ' ')).toBe('R$ 1.234,50');
  });

  it('does not choose an arbitrary winner for ties or invalid prices', () => {
    for (const selection of [
      [product('a', 10), product('b', 10)],
      [product('a', 10), product('b', 0)],
      [product('a', 10), product('b', Number.NaN)],
      [product('a', 10)],
    ]) {
      fixture.componentRef.setInput('products', selection);
      expect(component.lowestPriceId()).toBeNull();
    }
  });

  it('only closes on the backdrop and forwards Escape cancellation to the parent', () => {
    const close = vi.spyOn(component.closeComparison, 'emit');
    const backdrop = document.createElement('div');
    const content = document.createElement('div');
    component.closeOnBackdrop({
      target: content,
      currentTarget: backdrop,
    } as unknown as MouseEvent);
    expect(close).not.toHaveBeenCalled();
    component.closeOnBackdrop({
      target: backdrop,
      currentTarget: backdrop,
    } as unknown as MouseEvent);
    expect(close).toHaveBeenCalledTimes(1);
    const cancel = new Event('cancel', { cancelable: true });
    component.closeOnCancel(cancel);
    expect(cancel.defaultPrevented).toBe(true);
    expect(close).toHaveBeenCalledTimes(2);
  });
});
