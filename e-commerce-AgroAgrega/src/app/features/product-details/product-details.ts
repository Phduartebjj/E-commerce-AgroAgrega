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
  private readonly products: ProductModel[] = [
    {
      id: '1',
      title: 'Produto de exemplo 1',
      price: 199.90,
      description: 'Produto de exemplo para teste da página de detalhes.',
      category: 'Eletrônicos',
      images: ['https://placehold.co/600x600'],
    },
    {
      id: '2',
      title: 'Produto de exemplo 2',
      price: 299.90,
      description: 'Segundo produto utilizado para testar a navegação entre produtos.',
      category: 'Informática',
      images: ['https://placehold.co/600x600'],
    },
    {
      id: '3',
      title: 'Produto de exemplo 3',
      price: 99.90,
      description: 'Terceiro produto utilizado para testar a página de detalhes.',
      category: 'Acessórios',
      images: ['https://placehold.co/600x600'],
    },
  ];

  readonly product: ProductModel | undefined = this.products.find(
    (product) => product.id === this.id
  );
  readonly productNotFound = this.product === undefined;

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
