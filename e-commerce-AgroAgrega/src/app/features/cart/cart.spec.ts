import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CartComponent } from './cart';
import { provideRouter, RouterLink } from '@angular/router';
import { PrecoFormatadoPipe } from '../../shared/pipes/preco-formatado-pipe';

describe('CartComponent', () => {
  let component: CartComponent;
  let fixture: ComponentFixture<CartComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CartComponent, RouterLink, PrecoFormatadoPipe],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(CartComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
