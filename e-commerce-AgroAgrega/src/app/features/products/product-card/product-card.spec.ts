import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { ProductCardComponent } from './product-card';
import { ProductModel } from '../../../models/product';

describe('ProductCardComponent', () => {
  let component: ProductCardComponent;
  let fixture: ComponentFixture<ProductCardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProductCardComponent],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(ProductCardComponent);
    component = fixture.componentInstance;
    const product: ProductModel = {
      id: '1',
      title: 'Produto de teste',
      price: 10,
      description: 'Descricao de teste',
      category: 'Insumos',
      images: [],
    };
    fixture.componentRef.setInput('product', product);
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
