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
            snapshot: {
              paramMap: {
                get: (key: string) => (key === 'id' ? '123' : null),
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
    expect(component.id).toBe('123');
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

  it('should render product details', () => {
    const compiled = fixture.nativeElement as HTMLElement;

    expect(compiled.textContent).toContain('ID do produto: 123');
    expect(compiled.textContent).toContain('Produto de exemplo');
    expect(compiled.textContent).toContain('Adicionar ao carrinho');
  });
});
