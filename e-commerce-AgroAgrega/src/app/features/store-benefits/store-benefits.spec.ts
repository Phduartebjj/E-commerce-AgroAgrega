import { signal, WritableSignal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { vi } from 'vitest';

import { Auth } from '@core/services/auth/auth.service';
import { Cart } from '@core/services/cart/cart.service';
import { CouponModel } from '@models/coupon';
import { StoreBenefitsComponent } from './store-benefits';

describe('StoreBenefitsComponent', () => {
  let component: StoreBenefitsComponent;
  let fixture: ComponentFixture<StoreBenefitsComponent>;
  let appliedCoupon: WritableSignal<CouponModel | null>;
  let applyCoupon: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    appliedCoupon = signal<CouponModel | null>(null);
    applyCoupon = vi.fn((code: string) => {
      const coupon = component.coupons.find((item) => item.code === code) ?? null;
      appliedCoupon.set(coupon);
    });

    await TestBed.configureTestingModule({
      imports: [StoreBenefitsComponent],
      providers: [
        provideRouter([]),
        {
          provide: Cart,
          useValue: { coupon: appliedCoupon, applyCoupon },
        },
        {
          provide: Auth,
          useValue: {
            isLoggedIn: () => false,
            currentUserId: signal<string | null>(null),
            getId: () => '',
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(StoreBenefitsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should render the two real coupons from the cart service catalog', () => {
    const host = fixture.nativeElement as HTMLElement;

    expect(host.querySelectorAll('.coupon-card')).toHaveLength(2);
    expect(host.textContent).toContain('AGRO20');
    expect(host.textContent).toContain('BEMVINDO10');
  });

  it('should apply an available coupon directly to the cart', () => {
    const welcomeCoupon = component.coupons.find((coupon) => coupon.code === 'BEMVINDO10')!;

    component.applyCoupon(welcomeCoupon);

    expect(applyCoupon).toHaveBeenCalledWith('BEMVINDO10');
    expect(component.isCouponApplied(welcomeCoupon)).toBe(true);
    expect(component.feedbackMessage()).toContain('aplicado');
  });

  it('should send non-members to the Agro+ area for the exclusive coupon', () => {
    const router = TestBed.inject(Router);
    const navigateSpy = vi.spyOn(router, 'navigate').mockResolvedValue(true);

    component.applyCoupon(component.agroPlusCoupon);

    expect(navigateSpy).toHaveBeenCalledWith(['/agro-plus']);
    expect(applyCoupon).not.toHaveBeenCalled();
  });
});
