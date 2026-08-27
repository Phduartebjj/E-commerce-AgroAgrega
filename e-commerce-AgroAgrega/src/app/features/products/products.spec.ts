import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { ProductsComponent } from './products';

describe('ProductsComponent', () => {
  let component: ProductsComponent;
  let fixture: ComponentFixture<ProductsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProductsComponent],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(ProductsComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have 5 rating options from 5 to 1 stars', () => {
    expect(component.ratingOptions.length).toBe(5);
    expect(component.ratingOptions.map((o) => o.value)).toEqual([5, 4, 3, 2, 1]);
  });

  it('should filter products by rating', () => {
    component.selectedRating.set(4.8);
    const filtered = component.filteredProducts();
    expect(filtered.every((p) => p.rating >= 4.8)).toBe(true);
  });

  it('should clear all filters including rating', () => {
    component.selectedRating.set(4);
    component.sortOption.set('price-desc');
    component.selectedCategories.set(['Insumos']);

    component.clearFilters();

    expect(component.selectedRating()).toBeNull();
    expect(component.sortOption()).toBe('relevant');
    expect(component.selectedCategories()).toEqual([]);
  });
});

