import {
  afterRenderEffect,
  Component,
  computed,
  ElementRef,
  input,
  output,
  viewChild,
} from '@angular/core';

import { ProductModel } from '@models/product';

@Component({
  selector: 'app-product-comparison',
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

  private readonly dialog = viewChild<ElementRef<HTMLDialogElement>>('comparisonDialog');
  private readonly currency = new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  });

  readonly lowestPriceId = computed(() => {
    const products = this.products();
    if (
      products.length < 2 ||
      products.some((product) => !Number.isFinite(product.price) || product.price <= 0)
    ) {
      return null;
    }
    const lowest = Math.min(...products.map((product) => product.price));
    const matches = products.filter((product) => product.price === lowest);
    return matches.length === 1 ? matches[0].id : null;
  });

  constructor() {
    // Native modal dialogs keep keyboard focus inside and make the page behind inert.
    afterRenderEffect((onCleanup) => {
      const dialog = this.dialog()?.nativeElement;
      if (!dialog) return;

      const document = dialog.ownerDocument;
      const previousFocus = document.activeElement as HTMLElement | null;
      const previousOverflow = document.body.style.overflow;
      dialog.showModal();
      document.body.style.overflow = 'hidden';

      onCleanup(() => {
        dialog.close();
        document.body.style.overflow = previousOverflow;
        if (previousFocus?.isConnected) previousFocus.focus();
      });
    });
  }

  formatPrice(price: number): string {
    return this.currency.format(price);
  }

  ratingWidth(rating: number): number {
    return Math.min(5, Math.max(0, rating)) * 20;
  }

  closeOnCancel(event: Event): void {
    event.preventDefault();
    this.closeComparison.emit();
  }

  closeOnBackdrop(event: MouseEvent): void {
    if (event.target === event.currentTarget) {
      this.closeComparison.emit();
    }
  }
}
