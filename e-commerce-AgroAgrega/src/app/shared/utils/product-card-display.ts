const DEFAULT_INSTALLMENTS = 10;
const PIX_DISCOUNT_RATE = 0.1;

function roundCurrency(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

export function calculatePixPrice(price: number): number {
  return roundCurrency(price * (1 - PIX_DISCOUNT_RATE));
}

export function calculateDiscountPercent(price: number, originalPrice?: number): number {
  if (!originalPrice || originalPrice <= price) return 0;

  return Math.round((1 - price / originalPrice) * 100);
}

export function calculateInstallmentPrice(
  price: number,
  installments = DEFAULT_INSTALLMENTS,
): number {
  return roundCurrency(price / installments);
}

export function getWeeklySalesLabel(weeklySales = 0): string {
  if (weeklySales >= 1000) {
    const thousands = Math.floor(weeklySales / 1000);
    return `+${thousands} mil vendidos nesta semana`;
  }

  if (weeklySales === 1) return '1 vendido nesta semana';

  return `${weeklySales} vendidos nesta semana`;
}

export function addBusinessDays(startDate: Date, businessDays: number): Date {
  const result = new Date(startDate);
  let daysAdded = 0;

  while (daysAdded < businessDays) {
    result.setDate(result.getDate() + 1);
    const dayOfWeek = result.getDay();

    if (dayOfWeek !== 0 && dayOfWeek !== 6) daysAdded += 1;
  }

  return result;
}

export function getFreeDeliveryLabel(startDate = new Date()): string {
  const deliveryDate = addBusinessDays(startDate, 5);
  const formattedDate = new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: 'long',
  }).format(deliveryDate);

  return `Chega grátis até ${formattedDate}`;
}
