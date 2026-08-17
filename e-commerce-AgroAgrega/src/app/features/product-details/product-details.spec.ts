import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';

import { ProductDetails } from './product-details';

describe('ProductDetails', () => {
  let component: ProductDetails;
  let fixture: ComponentFixture<ProductDetails>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProductDetails],
      providers: [
        {
          provide: ActivatedRoute,
          useValue: {
            paramMap: {
              subscribe: (callback: (params: any) => void) => {
                callback({
                  get: (key: string) => (key === 'id' ? '1' : null),
                });
              },
            },
          },
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

  it('should identify when product does not exist', () => {
    expect(component.productNotFound).toBeFalsy();
  });

  it('should render product details', () => {
    const compiled = fixture.nativeElement as HTMLElement;

    expect(compiled.textContent).toContain('ID do produto: 1');
    expect(compiled.textContent).toContain('Produto de exemplo 1');
    expect(compiled.textContent).toContain('Adicionar ao carrinho');
  });
});
