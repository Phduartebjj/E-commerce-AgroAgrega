import { Component, input, output, signal } from '@angular/core';
import { UpperCasePipe } from '@angular/common';
import { PrecoFormatadoPipe } from '../../../shared/pipes/preco-formatado-pipe';
import { ProductModel } from '@models/product';
import { RouterLink } from '@angular/router';
import {
  calculateDiscountPercent,
  calculateInstallmentPrice,
  calculatePixPrice,
  getFreeDeliveryLabel,
  getWeeklySalesLabel,
} from '../../../shared/utils/product-card-display';
@Component({
  selector: 'app-product-card',
  imports: [UpperCasePipe, PrecoFormatadoPipe, RouterLink],
  templateUrl: './product-card.html',
  styleUrl: './product-card.css',
})
export class ProductCardComponent {
  product = input.required<ProductModel>();
  compareSelected = input(false);
  toggleCompare = output<ProductModel>();

  imageUnavailable = signal(false);
  readonly freeDeliveryLabel = getFreeDeliveryLabel();
  readonly calculateInstallmentPrice = calculateInstallmentPrice;
  readonly calculatePixPrice = calculatePixPrice;
  readonly getWeeklySalesLabel = getWeeklySalesLabel;

  handleImageError(): void {
    this.imageUnavailable.set(true);
  }

  getDiscountPercent(product: ProductModel): number {
    return calculateDiscountPercent(product.price, product.originalPrice);
  }

  getStars(rating: number): boolean[] {
    const roundedRating = Math.round(rating);

    return Array.from({ length: 5 }, (_, index) => {
      return index < roundedRating;
    });
  }
}
