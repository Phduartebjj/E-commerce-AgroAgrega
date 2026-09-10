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

  it('deve ser criado', () => {
    expect(component).toBeTruthy();
  });

  it('deve iniciar com todas as categorias e paginação numerada', () => {
    expect(component.selectedCategory()).toBe('Todos');
    expect(component.filteredProducts()).toHaveLength(52);
    expect(component.featuredProducts()).toHaveLength(8);
    expect(component.visibleProducts()).toHaveLength(4);
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

  it('deve manter uma página final parcial e rejeitar números de página inválidos', () => {
    component.goToPage(5);

    expect(component.currentPage()).toBe(5);
    expect(component.visibleProducts()).toHaveLength(4);

    for (const invalidPage of [0, 6, 1.5, Number.NaN]) {
      component.goToPage(invalidPage);
      expect(component.currentPage()).toBe(5);
    }
  });

  it('deve reiniciar para a primeira página quando a ordenação mudar', () => {
    component.goToPage(3);
    expect(component.currentPage()).toBe(3);

    component.updateSortOrder({ target: { value: 'menor_preco' } } as unknown as Event);

    expect(component.currentPage()).toBe(1);
  });

  it('deve renderizar uma página atual e limites de navegação desativados', () => {
    fixture.detectChanges();

    const host = fixture.nativeElement as HTMLElement;
    const currentButtons = host.querySelectorAll('[aria-current="page"]');
    const navigationButtons = host.querySelectorAll<HTMLButtonElement>('.pagination-navigation');
    const featuredCards = host.querySelectorAll('.featured-carousel .featured-card');

    expect(currentButtons).toHaveLength(1);
    expect(currentButtons[0].getAttribute('aria-label')).toBe('Página 1, atual');
    expect(navigationButtons[0].disabled).toBe(true);
    expect(navigationButtons[1].disabled).toBe(false);
    expect(host.textContent).not.toContain('Carregar mais');
    expect(host.textContent).toContain('52 produtos encontrados');
    expect(featuredCards).toHaveLength(8);
    expect(host.querySelectorAll('.carousel-controls button')).toHaveLength(2);
    expect(host.querySelector('#catalog-search-input')).toBeNull();
  });

  it('should expose active filters as individually removable chips', () => {
    component.selectedBrands.set(['AgroSense']);
    component.setMinRating(4);
    component.maxPriceFilter.set(500);

    const chips = component.activeFilterChips();
    expect(chips.map((chip) => chip.type)).toEqual(['brand', 'rating', 'price']);

    const brandChip = chips.find((chip) => chip.type === 'brand');
    expect(brandChip).toBeDefined();
    component.removeActiveFilter(brandChip!);

    expect(component.selectedBrands()).toEqual([]);
    expect(component.activeFilterChips().some((chip) => chip.type === 'brand')).toBe(false);
  });

  it('should compare between two and three products and enforce the selection limit', () => {
    const [first, second, third, fourth] = component.products();

    component.toggleProductComparison(first);
    component.openComparison();
    expect(component.comparisonOpen()).toBe(false);

    component.toggleProductComparison(second);
    component.openComparison();
    expect(component.comparisonOpen()).toBe(true);

    component.toggleProductComparison(third);
    component.toggleProductComparison(fourth);

    expect(component.comparedProducts()).toHaveLength(3);
    expect(component.isProductCompared(fourth.id)).toBe(false);
    expect(component.comparisonAnnouncement()).toContain('até 3 produtos');

    component.removeComparedProduct(first.id);
    expect(component.comparedProducts()).toHaveLength(2);

    component.clearComparison();
    expect(component.comparedProducts()).toEqual([]);
    expect(component.comparisonOpen()).toBe(false);
  });
});
