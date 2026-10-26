export interface ShippingOption {
  id: string;
  carrier: string;
  service: string;
  price: number;
  deliveryDays: { min: number; max: number };
}

export interface ShippingQuote {
  productId: string;
  quantity: number;
  destinationPostalCode: string;
  destinationLabel: string;
  originPostalCode: string;
  simulated: true;
  packageEstimated: boolean;
  options: ShippingOption[];
}
