import { RouterLink } from '@angular/router';
import { Component, ElementRef, ViewChild, signal, AfterViewInit, input } from '@angular/core';

import { PrecoFormatadoPipe } from '../../../../shared/pipes/preco-formatado-pipe';
import { ProductModel } from '@models/product';
import {
  calculateDiscountPercent,
  calculateInstallmentPrice,
  calculatePixPrice,
  getFreeDeliveryLabel,
  getWeeklySalesLabel,
} from '../../../../shared/utils/product-card-display';

@Component({
  selector: 'app-product-carousel',
  imports: [RouterLink, PrecoFormatadoPipe],
  templateUrl: './product-carousel.html',
  styleUrl: './product-carousel.css',
})
export class ProductCarousel implements AfterViewInit {
  produtos = input.required<ProductModel[]>();

  titulo = input<string>('Produtos em destaque');

  label = input<string>('SELEÇÃO AGROAGREGA');

  readonly freeDeliveryLabel = getFreeDeliveryLabel();
  readonly calculateDiscountPercent = calculateDiscountPercent;
  readonly calculateInstallmentPrice = calculateInstallmentPrice;
  readonly calculatePixPrice = calculatePixPrice;
  readonly getWeeklySalesLabel = getWeeklySalesLabel;

  ngAfterViewInit(): void {
    this.atualizarSetas();
  }

  atualizarSetas(): void {
    const lista = this.productsList.nativeElement;

    const limite = 40;
    const maxScroll = lista.scrollWidth - lista.clientWidth;

    this.podeRolarEsquerda.set(lista.scrollLeft > limite);

    this.podeRolarDireita.set(lista.scrollLeft < maxScroll - limite);
  }
  podeRolarEsquerda = signal(false);
  podeRolarDireita = signal(true);
  @ViewChild('productsList')
  productsList!: ElementRef<HTMLDivElement>;
  rolarEsquerda(): void {
    this.productsList.nativeElement.scrollBy({
      left: -300,
      behavior: 'smooth',
    });
  }

  rolarDireita(): void {
    this.productsList.nativeElement.scrollBy({
      left: 300,
      behavior: 'smooth',
    });
  }
}
