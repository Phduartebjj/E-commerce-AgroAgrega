import { Component, inject, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { ProductModel } from '../../models/product';
import { PrecoFormatadoPipe } from '../../shared/pipes/preco-formatado-pipe';
import { Cart } from '../../core/services/cart/cart.service';

@Component({
  selector: 'app-product-details',
  imports: [PrecoFormatadoPipe],
  templateUrl: './product-details.html',
  styleUrl: './product-details.css',
})
export class ProductDetails implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly cart = inject(Cart);

  id: string | null = null;

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

  product: ProductModel | undefined;

  quantity = 1;

  get productNotFound(): boolean {
    return this.product === undefined;
  }

  ngOnInit(): void {
    this.route.paramMap.subscribe((params) => {
      this.id = params.get('id');

      this.findProductById(this.id);
    });
  }

  private findProductById(id: string | null): void {
    this.product = this.products.find(
      (product) => product.id === id
    );
  }

  increaseQuantity(): void {
    this.quantity += 1;
  }

  decreaseQuantity(): void {
    if (this.quantity > 1) {
      this.quantity -= 1;
    }
  }

  addToCart(): void {
    // Validar se o produto existe
    if (!this.product) {
      return;
    }

    // Adicionar o produto ao carrinho quantidade vezes
    // CartService.addCartItem() sempre adiciona/incrementa em 1,
    // então chamamos N vezes para respeitar a quantidade selecionada
    for (let i = 0; i < this.quantity; i++) {
      this.cart.addCartItem(this.product);
    }
  }
}