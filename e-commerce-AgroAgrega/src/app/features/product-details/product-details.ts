import { Component, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Product } from '../../models/product';
@Component({
  selector: 'app-product-details',
  imports: [],
  templateUrl: './product-details.html',
  styleUrl: './product-details.css',
})
export class ProductDetails {
  private route = inject(ActivatedRoute);

  id = this.route.snapshot.paramMap.get('id');

  Product: Product = {
    id: '1',
    title: 'Produto de exemplo',
    price: 199.9,
    description: 'Produto de exemplo para teste da pagina de detalhes',
    category: 'Eletrônicos',
    images: ['https://placehold.co/600x600'],
  };

  quantity = 1;
  increaseQuantity():void{this.quantity++;}
  decreasequantity(): void{
    if (this.quantity > 1){
      this.quantity--;
    }
  }
addToCart(): void {
    console.log('Produto adicionado ao carrinho:', {
      product: this.Product,
      quantity: this.quantity,
    });
  }
}

