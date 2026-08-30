import { TestBed } from '@angular/core/testing';

import { ProductService } from './product.service';

describe('ProductService', () => {
  let service: ProductService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ProductService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should find product by id', () => {
    const products = service.getProducts()();
    const targetProduct = products[0];
    const found = service.getProductById(targetProduct.id);

    expect(found).toBeDefined();
    expect(found?.id).toBe(targetProduct.id);
  });

  it('should add a review and recalculate product rating', () => {
    const products = service.getProducts()();
    const targetProduct = products[0];
    const initialReviewsCount = targetProduct.reviews?.length ?? 0;

    service.addReview(targetProduct.id, {
      stars: 5,
      text: 'Excelente qualidade!',
      author: 'Tester',
    });

    const updatedProduct = service.getProductById(targetProduct.id);
    expect(updatedProduct).toBeDefined();
    expect(updatedProduct?.reviews?.length).toBe(initialReviewsCount + 1);
    expect(updatedProduct?.reviews?.[0].text).toBe('Excelente qualidade!');
    expect(updatedProduct?.reviews?.[0].stars).toBe(5);
    expect(typeof updatedProduct?.rating).toBe('number');
  });
});

