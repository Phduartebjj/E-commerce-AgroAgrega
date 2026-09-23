import { Component, HostListener, input, output } from '@angular/core';

import { ProductModel } from '@models/product';
import { PrecoFormatadoPipe } from '../../../shared/pipes/preco-formatado-pipe';

@Component({
  selector: 'app-product-comparison',
  imports: [PrecoFormatadoPipe],
  templateUrl: './product-comparison.html',
  styleUrl: './product-comparison.css',
})
export class ProductComparisonComponent {
  products = input.required<ProductModel[]>();
  open = input(false);
  announcement = input('');

  removeProduct = output<string>();
  clearProducts = output<void>();
  openComparison = output<void>();
  closeComparison = output<void>();

  @HostListener('document:keydown.escape')
  closeOnEscape(): void {
    if (this.open()) {
      this.closeComparison.emit();
    }
  }

  closeOnBackdrop(event: MouseEvent): void {
    if (event.target === event.currentTarget) {
      this.closeComparison.emit();
    }
  }
}
