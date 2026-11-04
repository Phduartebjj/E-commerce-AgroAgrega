import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { ProductModel } from '@models/product';
import { CartItemModel } from '@models/cartItem';
import { Cart } from '../../../core/services/cart/cart.service';
import { Auth } from '../../../core/services/auth/auth.service';
import { OfferProductCardComponent } from './offer-product-card';

describe('OfferProductCardComponent', () => {
  let fixture: ComponentFixture<OfferProductCardComponent>;
  const items = signal<CartItemModel[]>([]);
  const loggedIn = vi.fn(() => true);
  const addCartItem = vi.fn((product: ProductModel) => items.set([{ product, quantity: 1 }]));
  const product: ProductModel = {
    id: 'agro-041',
    title: 'Pulverizador costal',
    category: 'Ferramentas',
    description: '',
    images: ['assets/images/generated-products/product-041.webp'],
    price: 479.2,
    originalPrice: 599,
    rating: 4.6,
    flashOffer: true,
    flashOfferDiscount: 20,
  };

  beforeEach(async () => {
    items.set([]);
    loggedIn.mockReturnValue(true);
    addCartItem.mockClear();
    await TestBed.configureTestingModule({
      imports: [OfferProductCardComponent],
      providers: [
        provideRouter([]),
        { provide: Cart, useValue: { getCartItems: () => items, addCartItem } },
        { provide: Auth, useValue: { isLoggedIn: loggedIn } },
      ],
    }).compileComponents();
    fixture = TestBed.createComponent(OfferProductCardComponent);
    fixture.componentRef.setInput('product', product);
    await fixture.whenStable();
  });

  it('adds the current offer price to the cart without applying the discount twice', () => {
    const card = fixture.componentInstance;
    expect(card.savings()).toBeCloseTo(119.8);
    expect(card.installment()).toBe(47.92);
    expect(card.discount()).toBe(20);
    fixture.nativeElement.querySelector('.offer-card__add').click();
    expect(addCartItem).toHaveBeenCalledWith(product);
    expect(items()[0].product.price).toBe(479.2);
    expect(card.inCart()).toBe(true);
  });

  it('keeps favorites distinct using the real catalog identifiers', () => {
    const card = fixture.componentInstance;
    card.toggleFavorite();
    fixture.componentRef.setInput('product', { ...product, id: 'agro-042' });
    card.toggleFavorite();
    expect(card.favorites.favorites().map((item) => item.id)).toEqual(['agro-041', 'agro-042']);
    card.toggleFavorite();
    expect(card.favorites.isFavorite('agro-041')).toBe(true);
    expect(card.favorites.isFavorite('agro-042')).toBe(false);
  });

  it('directs guests to login before saving a favorite', () => {
    loggedIn.mockReturnValue(false);
    const navigate = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
    fixture.componentInstance.toggleFavorite();
    expect(navigate).toHaveBeenCalledWith(['/login']);
    expect(fixture.componentInstance.favorites.count()).toBe(0);
  });
});
