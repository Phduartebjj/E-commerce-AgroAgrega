import { describe, expect, it } from 'vitest';

import {
  addBusinessDays,
  calculateDiscountPercent,
  calculateInstallmentPrice,
  calculatePixPrice,
  getFreeDeliveryLabel,
  getWeeklySalesLabel,
} from './product-card-display';

describe('product card display helpers', () => {
  it('calculates the Pix price, installments and discount', () => {
    expect(calculatePixPrice(119.9)).toBe(107.91);
    expect(calculateInstallmentPrice(119.9)).toBe(11.99);
    expect(calculateDiscountPercent(80, 100)).toBe(20);
  });

  it('formats weekly sales at different volumes', () => {
    expect(getWeeklySalesLabel(1)).toBe('1 vendido nesta semana');
    expect(getWeeklySalesLabel(142)).toBe('142 vendidos nesta semana');
    expect(getWeeklySalesLabel(1250)).toBe('+1 mil vendidos nesta semana');
  });

  it('keeps the delivery estimate in the future and skips weekends', () => {
    const monday = new Date(2026, 8, 14, 12);

    expect(addBusinessDays(monday, 5).getDate()).toBe(21);
    expect(getFreeDeliveryLabel(monday)).toContain('21 de setembro');
  });
});
