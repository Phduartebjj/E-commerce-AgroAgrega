import { signal, WritableSignal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { vi } from 'vitest';

import { Auth } from '@core/services/auth/auth.service';
import { Cart } from '@core/services/cart/cart.service';
import { CouponModel } from '@models/coupon';
import { StoreBenefitsComponent } from './store-benefits';

// Verifica cupons, benefícios Agro+ e navegação entre benefícios da loja.
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

  it('should render all coupons from the cart service catalog', () => {
    const host = fixture.nativeElement as HTMLElement;

    expect(host.querySelectorAll('.coupon-card')).toHaveLength(6);
    expect(host.textContent).toContain('AGRO20');
    expect(host.textContent).toContain('BEMVINDO10');
    expect(host.textContent).toContain('CAMPO15');
    expect(host.textContent).toContain('SAFRA12');
    expect(host.textContent).toContain('EQUIPA10');
    expect(host.textContent).toContain('AGUA8');
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

  it('should offer an expanded set of Agro+ benefits', () => {
    expect(component.agroPlusBenefits).toHaveLength(10);
    expect(component.agroPlusBenefits.map((benefit) => benefit.id)).toEqual(
      expect.arrayContaining(['cashback', 'shipping', 'points', 'support', 'price-protection']),
    );
  });

  it('should update the highlighted benefit when it is selected', () => {
    component.selectBenefit('shipping');

    expect(component.selectedBenefitId()).toBe('shipping');
    expect(component.selectedBenefit.title).toContain('Frete grátis');
  });

  it('should filter benefits and keep guided navigation inside the selected category', () => {
    component.selectBenefitCategory('exclusive');

    expect(component.visibleBenefits.every((benefit) => benefit.category === 'exclusive')).toBe(
      true,
    );
    expect(component.selectedBenefit.category).toBe('exclusive');

    component.showAdjacentBenefit(1);
    expect(component.selectedBenefit.category).toBe('exclusive');
  });

  it('should calculate the estimated advantage after the monthly subscription price', () => {
    component.monthlyPurchaseValue.set(500);

    expect(component.subscriptionPrice).toBe(20.9);
    expect(component.estimatedMonthlyAdvantage).toBeCloseTo(119);
    expect(component.estimatedYearlyAdvantage).toBeCloseTo(1428);
  });
});
