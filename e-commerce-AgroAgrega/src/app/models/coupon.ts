export interface CouponModel {
  code: string;
  discountPercentage: number;
  campaignCode?: string;
  validOn?: string;
}
