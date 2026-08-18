import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';
import { vi } from 'vitest';

import { ProductDetails } from './product-details';
import { Cart } from '../../core/services/cart/cart.service';

function createActivatedRoute(id: string) {
  return {
    paramMap: {
      subscribe: (callback: (params: { get: (key: string) => string | null }) => void) => {
        callback({
          get: (key: string) => (key === 'id' ? id : null),
        });
      },
    },
  };
}

describe('ProductDetails', () => {
  let component: ProductDetails;
  let fixture: ComponentFixture<ProductDetails>;
  let mockCartService: { addCartItem: ReturnType<typeof vi.fn> };

  beforeEach(async () => {
    // Criar mock do CartService usando Vitest
    mockCartService = {
      addCartItem: vi.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [ProductDetails],
      providers: [
        {
          provide: ActivatedRoute,
          useValue: createActivatedRoute('1'),
        },
        {
          provide: Cart,
          useValue: mockCartService,
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ProductDetails);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should read the product id from the route', () => {
    expect(component.id).toBe('1');
  });

  it('should find the product by id', () => {
    expect(component.product).toBeTruthy();
    expect(component.product?.id).toBe('1');
    expect(component.product?.title).toBe('Produto de exemplo 1');
  });

  it('should increase and decrease quantity within valid range', () => {
    expect(component.quantity).toBe(1);

    component.increaseQuantity();
    expect(component.quantity).toBe(2);

    component.decreaseQuantity();
    expect(component.quantity).toBe(1);

    component.decreaseQuantity();
    expect(component.quantity).toBe(1);
  });

  it('should identify when product exists', () => {
    expect(component.productNotFound).toBeFalsy();
  });

  it('should render product details', () => {
    const compiled = fixture.nativeElement as HTMLElement;

    expect(compiled.textContent).toContain('ID do produto: 1');
    expect(compiled.textContent).toContain('Produto de exemplo 1');
    expect(compiled.textContent).toContain('Adicionar ao carrinho');
  });

  it('should inject CartService', () => {
    expect(component['cart']).toBeTruthy();
  });

  it('should call addCartItem with current product when addToCart is called', () => {
    component.addToCart();

    expect(mockCartService.addCartItem).toHaveBeenCalledWith(component.product);
    expect(mockCartService.addCartItem).toHaveBeenCalledTimes(1);
  });

  it('should call addCartItem multiple times based on selected quantity', () => {
    component.quantity = 3;

    component.addToCart();

    expect(mockCartService.addCartItem).toHaveBeenCalledWith(component.product);
    expect(mockCartService.addCartItem).toHaveBeenCalledTimes(3);
  });

  it('should not call addCartItem when product does not exist', () => {
    component.product = undefined;

    component.addToCart();

    expect(mockCartService.addCartItem).not.toHaveBeenCalled();
  });

  it('should identify when product does not exist', async () => {
    await TestBed.resetTestingModule();

    const mockCartServiceNotFound = {
      addCartItem: vi.fn(),
    };

    await TestBed.configureTestingModule({
      imports: [ProductDetails],
      providers: [
        {
          provide: ActivatedRoute,
          useValue: createActivatedRoute('999'),
        },
        {
          provide: Cart,
          useValue: mockCartServiceNotFound,
        },
      ],
    }).compileComponents();

    const notFoundFixture = TestBed.createComponent(ProductDetails);
    const notFoundComponent = notFoundFixture.componentInstance;

    notFoundFixture.detectChanges();

    expect(notFoundComponent.id).toBe('999');
    expect(notFoundComponent.product).toBeUndefined();
    expect(notFoundComponent.productNotFound).toBe(true);
  });
});
