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

  it('should start with all categories and numbered pagination', () => {
    expect(component.selectedCategory()).toBe('Todos');
    expect(component.filteredProducts()).toHaveLength(52);
    expect(component.featuredProducts()).toHaveLength(2);
    expect(component.visibleProducts()).toHaveLength(10);
    expect(component.currentPage()).toBe(1);
    expect(component.totalPages()).toBe(5);
    expect(component.pageNumbers()).toEqual([1, 2, 3, 4, 5]);

    const firstPageIds = new Set([
      ...component.featuredProducts().map((product) => product.id),
      ...component.visibleProducts().map((product) => product.id),
    ]);
    expect(firstPageIds.size).toBe(12);

    component.goToPage(2);

    expect(component.currentPage()).toBe(2);
    expect(component.visibleProducts()).toHaveLength(12);
    expect(component.visibleProducts().some((product) => firstPageIds.has(product.id))).toBe(false);
  });

  it('should keep a partial final page and reject invalid page numbers', () => {
    component.goToPage(5);

    expect(component.currentPage()).toBe(5);
    expect(component.visibleProducts()).toHaveLength(4);

    for (const invalidPage of [0, 6, 1.5, Number.NaN]) {
      component.goToPage(invalidPage);
      expect(component.currentPage()).toBe(5);
    }
  });

  it('should reset to the first page when sorting changes', () => {
    component.goToPage(3);
    expect(component.currentPage()).toBe(3);

    component.updateSortOrder({ target: { value: 'menor_preco' } } as unknown as Event);

    expect(component.currentPage()).toBe(1);
  });

  it('should render one current page and disabled navigation limits', () => {
    fixture.detectChanges();

    const host = fixture.nativeElement as HTMLElement;
    const currentButtons = host.querySelectorAll('[aria-current="page"]');
    const navigationButtons = host.querySelectorAll<HTMLButtonElement>('.pagination-navigation');

    expect(currentButtons).toHaveLength(1);
    expect(currentButtons[0].getAttribute('aria-label')).toBe('Página 1, atual');
    expect(navigationButtons[0].disabled).toBe(true);
    expect(navigationButtons[1].disabled).toBe(false);
    expect(host.textContent).not.toContain('Carregar mais');
    expect(host.textContent).not.toContain('produtos encontrados');
  });
});
