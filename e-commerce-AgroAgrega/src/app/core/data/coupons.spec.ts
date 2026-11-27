import { COUPONS, couponDateKey, dailyCoupons, findAvailableCoupon } from './coupons';

describe('daily coupon catalog', () => {
  const today = new Date('2026-10-13T15:00:00Z');

  it('offers twelve unique coupons, including the six new campaigns', () => {
    const coupons = dailyCoupons(today);
    expect(coupons).toHaveLength(12);
    expect(new Set(coupons.map((coupon) => coupon.code)).size).toBe(12);
    expect(coupons.map((coupon) => coupon.campaignCode)).toEqual(
      expect.arrayContaining([
        'RAIZ10',
        'CULTIVO12',
        'PASTO8',
        'COLHEITA15',
        'TRATOR10',
        'PRECISAO12',
      ]),
    );
    expect(coupons.map((coupon) => coupon.discountPercentage)).toEqual(
      COUPONS.map((coupon) => coupon.discountPercentage),
    );
  });

  it('keeps the same codes throughout the Brazilian day, even past UTC midnight', () => {
    expect(dailyCoupons(new Date('2026-10-13T03:00:00Z'))).toEqual(dailyCoupons(today));
    expect(dailyCoupons(new Date('2026-10-14T02:59:59.999Z'))).toEqual(dailyCoupons(today));
  });

  it.each([
    ['2026-10-14T03:00:00Z', '2026-10-14'],
    ['2027-01-01T02:59:59Z', '2026-12-31'],
    ['2027-01-01T03:00:00Z', '2027-01-01'],
    ['2028-02-29T03:00:00Z', '2028-02-29'],
  ])('uses the correct calendar date at %s', (timestamp, expected) => {
    expect(couponDateKey(new Date(timestamp))).toBe(expected);
  });

  it('replaces every dated code at midnight and rejects expired or future codes', () => {
    const tomorrow = new Date('2026-10-14T03:00:00Z');
    const current = dailyCoupons(today);
    const next = dailyCoupons(tomorrow);
    expect(next.some((coupon) => current.some((old) => old.code === coupon.code))).toBe(false);
    for (const coupon of current) {
      expect(findAvailableCoupon(coupon.code, today)).toEqual(coupon);
      expect(findAvailableCoupon(coupon.code, tomorrow)).toBeNull();
    }
    expect(findAvailableCoupon(next[0].code, today)).toBeNull();
  });

  it('normalizes input and preserves existing undated campaign codes', () => {
    expect(findAvailableCoupon('  raiz10-20261013  ', today)?.discountPercentage).toBe(10);
    expect(findAvailableCoupon('AGRO20', today)).toEqual({
      code: 'AGRO20',
      discountPercentage: 20,
    });
    expect(findAvailableCoupon('CAMPO15-202610130', today)).toBeNull();
    expect(findAvailableCoupon('INVALIDO', today)).toBeNull();
  });
});
