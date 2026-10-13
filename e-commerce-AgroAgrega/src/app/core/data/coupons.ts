import { CouponModel } from '@models/coupon';

export const COUPONS: CouponModel[] = [
  {
    code: 'AGRO20',
    discountPercentage: 20,
  },
  {
    code: 'BEMVINDO10',
    discountPercentage: 10,
  },
  {
    code: 'CAMPO15',
    discountPercentage: 15,
  },
  {
    code: 'SAFRA12',
    discountPercentage: 12,
  },
  {
    code: 'EQUIPA10',
    discountPercentage: 10,
  },
  {
    code: 'AGUA8',
    discountPercentage: 8,
  },
  { code: 'RAIZ10', discountPercentage: 10 },
  { code: 'CULTIVO12', discountPercentage: 12 },
  { code: 'PASTO8', discountPercentage: 8 },
  { code: 'COLHEITA15', discountPercentage: 15 },
  { code: 'TRATOR10', discountPercentage: 10 },
  { code: 'PRECISAO12', discountPercentage: 12 },
];

export const COUPON_TIME_ZONE = 'America/Sao_Paulo';

const couponDateFormatter = new Intl.DateTimeFormat('en-CA', {
  timeZone: COUPON_TIME_ZONE,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});

export function couponDateKey(date: Date = new Date()): string {
  const parts = couponDateFormatter.formatToParts(date);
  const part = (name: string) => parts.find((item) => item.type === name)!.value;
  return `${part('year')}-${part('month')}-${part('day')}`;
}

export function dailyCoupons(date: Date = new Date()): CouponModel[] {
  const validOn = couponDateKey(date);
  const suffix = validOn.replace(/-/g, '');
  return COUPONS.map((coupon) => ({
    ...coupon,
    code: `${coupon.code}-${suffix}`,
    campaignCode: coupon.code,
    validOn,
  }));
}

export function findAvailableCoupon(code: string, date: Date = new Date()): CouponModel | null {
  const normalizedCode = code.trim().toUpperCase();
  // Keep existing undated campaigns compatible with the Agro+ page and shared codes.
  return (
    dailyCoupons(date).find((coupon) => coupon.code === normalizedCode) ??
    COUPONS.find((coupon) => coupon.code === normalizedCode) ??
    null
  );
}
