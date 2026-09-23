import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BestSellerCaroseul } from './best-seller-caroseul';

// Verifica se o carrossel de produtos mais vendidos é criado corretamente.
describe('BestSellerCaroseul', () => {
  let component: BestSellerCaroseul;
  let fixture: ComponentFixture<BestSellerCaroseul>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BestSellerCaroseul],
    }).compileComponents();

    fixture = TestBed.createComponent(BestSellerCaroseul);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
