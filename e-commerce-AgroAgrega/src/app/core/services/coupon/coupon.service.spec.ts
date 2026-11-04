import { PLATFORM_ID, TransferState, makeStateKey } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { vi } from 'vitest';
import { CouponService } from './coupon.service';

describe('CouponService', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-10-14T02:59:58Z'));
    TestBed.configureTestingModule({});
  });

  afterEach(() => {
    TestBed.resetTestingModule();
    vi.useRealTimers();
  });

  it('renews the catalog automatically at midnight in Brasília', () => {
    const service = TestBed.inject(CouponService);
    service.refresh();
    const previousCodes = service.coupons().map((coupon) => coupon.code);
    vi.advanceTimersByTime(1900);
    expect(service.day()).toBe('2026-10-13');
    vi.advanceTimersByTime(200);
    expect(service.day()).toBe('2026-10-14');
    expect(service.dateLabel()).toBe('14/10/2026');
    expect(service.coupons()).toHaveLength(12);
    expect(service.coupons().every((coupon) => !previousCodes.includes(coupon.code))).toBe(true);
  });

  it('rechecks validity immediately when a suspended page tries to apply a coupon', () => {
    const service = TestBed.inject(CouponService);
    const oldCode = service.coupons()[1].code;
    vi.setSystemTime(new Date('2026-10-15T12:00:00Z'));
    expect(service.find(oldCode)).toBeNull();
    expect(service.day()).toBe('2026-10-15');
    expect(service.find('BEMVINDO10-20261015')?.discountPercentage).toBe(10);
  });

  it('starts with the server date for hydration, then refreshes stale prerendered coupons', () => {
    TestBed.inject(TransferState).set(
      makeStateKey<string>('coupon-catalog-date'),
      '2026-10-01T12:00:00Z',
    );
    const service = TestBed.inject(CouponService);
    expect(service.day()).toBe('2026-10-01');
    service.refresh();
    expect(service.day()).toBe('2026-10-13');
  });

  it('cleans up the refresh timer when destroyed', () => {
    const service = TestBed.inject(CouponService);
    service.refresh();
    const refresh = vi.spyOn(service, 'refresh');
    TestBed.resetTestingModule();
    vi.advanceTimersByTime(120_000);
    expect(refresh).not.toHaveBeenCalled();
  });

  it('does not schedule timers during server rendering', () => {
    TestBed.overrideProvider(PLATFORM_ID, { useValue: 'server' });
    const service = TestBed.inject(CouponService);
    service.refresh();
    expect(service.coupons()).toHaveLength(12);
    expect(vi.getTimerCount()).toBe(0);
  });
});
