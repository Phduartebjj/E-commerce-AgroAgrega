import { Component, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { ProductModel } from '../../models/product';
import { PrecoFormatadoPipe } from '../../shared/pipes/preco-formatado-pipe';

@Component({
  selector: 'app-product-details',
  imports: [PrecoFormatadoPipe],
  templateUrl: './product-details.html',
  styleUrl: './product-details.css',
})
export class ProductDetails {
  private readonly route = inject(ActivatedRoute);

  readonly id = this.route.snapshot.paramMap.get('id');

  product: ProductModel = {
    id: '1',
    title: 'Produto de exemplo',
    price: 199.9,
    description: 'Produto de exemplo para teste da página de detalhes',
    category: 'Eletrônicos',
    images: ['https://placehold.co/600x600'],
  };

  quantity = 1;

  increaseQuantity(): void {
    this.quantity += 1;
  }

  decreaseQuantity(): void {
    if (this.quantity > 1) {
      this.quantity -= 1;
    }
  }

  addToCart(): void {
    console.log('Produto adicionado ao carrinho:', {
      product: this.product,
      quantity: this.quantity,
    });
  }
}