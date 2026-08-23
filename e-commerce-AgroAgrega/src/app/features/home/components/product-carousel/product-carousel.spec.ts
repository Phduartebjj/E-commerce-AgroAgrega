import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProductCarousel } from './product-carousel';

describe('ProductCarousel', () => {
  let component: ProductCarousel;
  let fixture: ComponentFixture<ProductCarousel>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProductCarousel],
    }).compileComponents();

    fixture = TestBed.createComponent(ProductCarousel);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
