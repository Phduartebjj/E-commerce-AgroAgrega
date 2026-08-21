import { Component, inject, OnInit } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';

import { ProductModel } from '../../models/product';
import { Cart } from '../../core/services/cart/cart.service';
import { PrecoFormatadoPipe } from '../../shared/pipes/preco-formatado-pipe';

interface ProductReview {
  stars: number;
  text: string;
}

@Component({
  selector: 'app-product-details',
  imports: [PrecoFormatadoPipe, RouterLink, FormsModule],
  templateUrl: './product-details.html',
  styleUrl: './product-details.css',
})
export class ProductDetails implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly cart = inject(Cart);

  showCartNotification = false;

  id: string | null = null;

  private readonly products: ProductModel[] = [
    {
      id: '1',
      title: 'Produto de exemplo 1',
      price: 199.9,
      description: 'Produto de exemplo para teste da página de detalhes.',
      category: 'Eletrônicos',
      images: ['https://placehold.co/600x600'],
    },
    {
      id: '2',
      title: 'Produto de exemplo 2',
      price: 299.9,
      description:
        'Segundo produto utilizado para testar a navegação entre produtos.',
      category: 'Informática',
      images: ['https://placehold.co/600x600'],
    },
    {
      id: '3',
      title: 'Produto de exemplo 3',
      price: 99.9,
      description:
        'Terceiro produto utilizado para testar a página de detalhes.',
      category: 'Acessórios',
      images: ['https://placehold.co/600x600'],
    },
  ];

  product: ProductModel | undefined;

  quantity = 1;

  selectedImageIndex = 0;

// =========================
// AVALIAÇÕES
// =========================

activeTab: 'details' | 'reviews' = 'details';

reviews: ProductReview[] = [];

selectedRating = 0;

reviewText = '';

selectTab(tab: 'details' | 'reviews'): void {
  this.activeTab = tab;
}

selectRating(rating: number): void {
  if (rating < 1 || rating > 5) {
    return;
  }

  this.selectedRating = rating;
}

submitReview(): void {
  const text = this.reviewText.trim();

  if (this.selectedRating < 1 || !text) {
    return;
  }

  this.reviews.push({
    stars: this.selectedRating,
    text,
  });

  this.selectedRating = 0;
  this.reviewText = '';
}

  // =========================
  // GALERIA
  // =========================

  get selectedImage(): string | undefined {
    return this.product?.images[this.selectedImageIndex];
  }

  selectImage(index: number): void {
    if (!this.product) {
      return;
    }

    if (index < 0 || index >= this.product.images.length) {
      return;
    }

    this.selectedImageIndex = index;
  }

  nextImage(): void {
    if (!this.product || this.product.images.length === 0) {
      return;
    }

    this.selectedImageIndex =
      (this.selectedImageIndex + 1) % this.product.images.length;
  }

  previousImage(): void {
    if (!this.product || this.product.images.length === 0) {
      return;
    }

    this.selectedImageIndex =
      (this.selectedImageIndex - 1 + this.product.images.length) %
      this.product.images.length;
  }

  // =========================
  // PRODUTO
  // =========================

  get productNotFound(): boolean {
    return this.product === undefined;
  }

  ngOnInit(): void {
    this.route.paramMap.subscribe((params) => {
      this.id = params.get('id');

      this.product = this.products.find(
        (product) => product.id === this.id,
      );

      this.selectedImageIndex = 0;
    });
  }

  // =========================
  // QUANTIDADE
  // =========================

  increaseQuantity(): void {
    this.quantity += 1;
  }

  decreaseQuantity(): void {
    if (this.quantity > 1) {
      this.quantity -= 1;
    }
  }

  // =========================
  // CARRINHO
  // =========================

  addToCart(): void {
    if (!this.product || this.quantity <= 0) {
      return;
    }

    this.cart.addCartItem(this.product, this.quantity);

    this.showCartNotification = true;

    setTimeout(() => {
      this.showCartNotification = false;
    }, 3000);
  }

  get reviewAverage(): number {
    if (this.reviews.length === 0) {
      return 0;
    }

    const total = this.reviews.reduce(
      (sum, review) => sum + review.stars,
      0,
    );

    return total / this.reviews.length;
  }

  get reviewCount(): number {
    return this.reviews.length;
  }

  getRatingCount(stars: number): number {
    return this.reviews.filter(
      (review) => review.stars === stars,
    ).length;
  }

  getRatingPercentage(stars: number): number {
    if (this.reviews.length === 0) {
      return 0;
    }

    return (
      (this.getRatingCount(stars) / this.reviews.length) *
      100
    );
  }
} 