import { Component, input, output, signal } from '@angular/core';
import { UpperCasePipe } from '@angular/common';
import { PrecoFormatadoPipe } from '../../../shared/pipes/preco-formatado-pipe';
import { ProductModel } from '@models/product';
import { RouterLink } from '@angular/router';
@Component({
  selector: 'app-product-card',
  imports: [UpperCasePipe, PrecoFormatadoPipe, RouterLink],
  templateUrl: './product-card.html',
  styleUrl: './product-card.css',
})
export class ProductCardComponent {
  product = input.required<ProductModel>();
  addToCart = output<ProductModel>();

  adicionado = signal(false);

  adicionarAoCarrinho(): void {
    this.addToCart.emit(this.product());
    this.adicionado.set(true);

    setTimeout(() => {
      this.adicionado.set(false);
    }, 2000);
  }
}
