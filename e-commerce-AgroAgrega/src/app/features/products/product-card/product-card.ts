import { Component, input, output } from '@angular/core';
import { UpperCasePipe } from '@angular/common';
import { PrecoFormatadoPipe } from '../../../shared/pipes/preco-formatado-pipe';
import { ProductModel } from '@models/product';
@Component({
  selector: 'app-product-card',
  imports: [UpperCasePipe, PrecoFormatadoPipe],
  templateUrl: './product-card.html',
  styleUrl: './product-card.css',
})
export class ProductCardComponent {
  product = input.required<ProductModel>()
  addToCart = output<ProductModel>()
}
