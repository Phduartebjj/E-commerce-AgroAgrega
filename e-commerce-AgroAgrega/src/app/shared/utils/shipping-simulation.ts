import { CepModel } from '../../models/cep.model';
import { ProductCategory, ProductModel } from '../../models/product';
import { ShippingQuote } from '../../models/shipping';

export const SHIPPING_ORIGIN_CEP = '20211060';

// Demonstration tariffs from Rio de Janeiro. These are not carrier prices.
const REGIONS = [
  { states: ['RJ'], base: 12.9, perKg: 1.4, min: 2, max: 4 },
  { states: ['ES', 'MG', 'SP'], base: 19.9, perKg: 1.8, min: 3, max: 6 },
  { states: ['PR', 'RS', 'SC'], base: 24.9, perKg: 2.2, min: 4, max: 8 },
  { states: ['DF', 'GO', 'MS', 'MT'], base: 29.9, perKg: 2.6, min: 5, max: 9 },
  { states: ['AL', 'BA', 'CE', 'MA', 'PB', 'PE', 'PI', 'RN', 'SE'], base: 34.9, perKg: 3, min: 6, max: 11 },
  { states: ['AC', 'AM', 'AP', 'PA', 'RO', 'RR', 'TO'], base: 44.9, perKg: 3.8, min: 8, max: 15 },
];

// Standard demonstration packages: kg and cm. No physical measurements were supplied.
const PACKAGES: Record<ProductCategory, { weight: number; width: number; height: number; length: number }> = {
  'Agricultura de Precisão': { weight: 3, width: 35, height: 25, length: 40 },
  'Irrigação': { weight: 2.5, width: 30, height: 20, length: 40 },
  'Pecuária': { weight: 4, width: 30, height: 30, length: 40 },
  'Insumos': { weight: 5.5, width: 25, height: 25, length: 30 },
  'Ferramentas': { weight: 2, width: 20, height: 15, length: 40 },
};

export function simulateShipping(product: ProductModel, quantity: number, postalCode: string, address: CepModel): ShippingQuote {
  const region = REGIONS.find((region) => region.states.includes(address.uf.toUpperCase()));
  if (!region) throw new Error('Não foi possível identificar o estado deste CEP. Confira os números.');
  const pack = PACKAGES[product.category];
  const declaredWeight = product.title.match(/(\d+(?:[.,]\d+)?)\s*kg\b/i);
  const weight = declaredWeight ? Number(declaredWeight[1].replace(',', '.')) + 0.3 : pack.weight;
  const billableWeight = Math.max(weight, pack.width * pack.height * pack.length / 6000) * quantity;
  const samePostalCode = postalCode === SHIPPING_ORIGIN_CEP;
  const base = samePostalCode ? 9.9 : region.base;
  const economicPrice = Math.round((base + billableWeight * region.perKg + product.price * quantity * 0.002) * 100) / 100;
  const min = samePostalCode ? 1 : region.min;
  const max = samePostalCode ? 2 : region.max;
  return {
    productId: product.id, quantity, destinationPostalCode: postalCode,
    destinationLabel: `${address.localidade} – ${address.uf.toUpperCase()}`,
    originPostalCode: SHIPPING_ORIGIN_CEP, simulated: true, packageEstimated: true,
    options: [
      {
        id: 'economic', carrier: 'AgroAgrega', service: 'Entrega econômica', price: economicPrice,
        deliveryDays: { min, max },
      },
      {
        id: 'express', carrier: 'AgroAgrega', service: 'Entrega expressa',
        price: Math.round((economicPrice * 1.55 + 8) * 100) / 100,
        deliveryDays: { min: Math.max(1, Math.ceil(min / 2)), max: Math.max(1, Math.ceil(max / 2)) },
      },
    ],
  };
}
