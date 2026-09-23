import { TestBed } from '@angular/core/testing';
import { render, screen } from '@testing-library/angular';
import { productsItems } from '../../data/products';
import {
  applyDailyFlashOffers,
  ProductService,
  selectDailyPopularProducts,
} from './product.service';

// Verifica o catálogo, a busca de produtos e as ofertas diárias.
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
      productImages.every((image) => image.includes('assets/images/generated-products/product-')),
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

  it('deve criar seis ofertas relâmpago determinísticas para cada dia', () => {
    const date = new Date(2026, 8, 15, 10);
    const firstResult = applyDailyFlashOffers(productsItems, date);
    const secondResult = applyDailyFlashOffers(productsItems, date);
    const firstOffers = firstResult.filter((product) => product.flashOffer);
    const secondOffers = secondResult.filter((product) => product.flashOffer);

    expect(firstOffers).toHaveLength(6);
    expect(firstOffers.map((product) => product.id)).toEqual(
      secondOffers.map((product) => product.id),
    );
    expect(firstOffers.every((product) => product.originalPrice! > product.price)).toBe(true);
    expect(firstOffers.every((product) => product.flashOfferDate === '2026-09-15')).toBe(true);
  });

  it('deve trocar todos os produtos relâmpago no dia seguinte', () => {
    const todayOffers = applyDailyFlashOffers(productsItems, new Date(2026, 8, 15))
      .filter((product) => product.flashOffer)
      .map((product) => product.id);
    const tomorrowOffers = applyDailyFlashOffers(productsItems, new Date(2026, 8, 16))
      .filter((product) => product.flashOffer)
      .map((product) => product.id);

    expect(tomorrowOffers).toHaveLength(6);
    expect(tomorrowOffers.some((productId) => todayOffers.includes(productId))).toBe(false);
  });

  it('deve renovar os mais procurados diariamente sem repetir os itens do dia anterior', () => {
    const products = service.getProducts()();
    const selections = Array.from({ length: 7 }, (_, day) =>
      selectDailyPopularProducts(products, new Date(2026, 8, 21 + day, 12), 8),
    );
    const topProducts = new Set(
      [...products]
        .sort((first, second) => (second.weeklySales ?? 0) - (first.weeklySales ?? 0))
        .slice(0, 31)
        .map((product) => product.id),
    );

    expect(selections.every((selection) => selection.length === 8)).toBe(true);
    expect(
      selections.every((selection) => selection.every((product) => topProducts.has(product.id))),
    ).toBe(true);
    expect(
      selectDailyPopularProducts(products, new Date(2026, 8, 21, 23), 8).map(
        (product) => product.id,
      ),
    ).toEqual(selections[0].map((product) => product.id));

    for (let day = 1; day < selections.length; day += 1) {
      const previousIds = new Set(selections[day - 1].map((product) => product.id));
      expect(selections[day].some((product) => previousIds.has(product.id))).toBe(false);
    }

    const todayHome = selectDailyPopularProducts(products, new Date(2026, 8, 21), 6);
    const tomorrowHome = selectDailyPopularProducts(products, new Date(2026, 8, 22), 6);
    const todayHomeIds = new Set(todayHome.map((product) => product.id));
    expect(todayHome).toHaveLength(6);
    expect(tomorrowHome.some((product) => todayHomeIds.has(product.id))).toBe(false);
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
