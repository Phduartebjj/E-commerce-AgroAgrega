import { TestBed } from '@angular/core/testing';
import { render, screen } from '@testing-library/angular';
import { ProductService } from './product.service';

describe('ProductService', () => {
  let service: ProductService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ProductService);
  });

  it('deve ser criado', () => {
    expect(service).toBeTruthy();
  });

  it('deve encontrar um produto pelo ID', () => {
    const products = service.getProducts()();
    const targetProduct = products[0];
    const found = service.getProductById(targetProduct.id);

    expect(found).toBeDefined();
    expect(found?.id).toBe(targetProduct.id);
  });

  it('deve expor o catálogo expandido com produtos únicos e completos', () => {
    const products = service.getProducts()();
    const productIds = products.map((product) => product.id);
    const productImages = products.map((product) => product.images[0]);

    expect(products).toHaveLength(52);
    expect(new Set(productIds).size).toBe(products.length);
    expect(new Set(productImages).size).toBe(products.length);
    expect(products.every((product) => product.images.length > 0)).toBe(true);
    expect(
      productImages.every((image) => image.startsWith('assets/images/generated-products/product-')),
    ).toBe(true);
    expect(products.every((product) => (product.weeklySales ?? 0) > 0)).toBe(true);
  });

  it('deve manter cada categoria do catálogo bem representada', () => {
    const products = service.getProducts()();

    for (const category of service.getProductCategories()) {
      expect(
        products.filter((product) => product.category === category).length,
      ).toBeGreaterThanOrEqual(10);
    }
  });

  it('deve adicinar uma avaliacao e recalcular a classificacao do produto', () => {
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
