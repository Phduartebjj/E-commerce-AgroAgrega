import { Component, inject, OnInit } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';

import { ProductModel } from '../../models/product';
import { Cart } from '../../core/services/cart/cart.service';
import { productsItems } from '../../core/data/products';
import { PrecoFormatadoPipe } from '../../shared/pipes/preco-formatado-pipe';

@Component({
  selector: 'app-product-details',
  imports: [PrecoFormatadoPipe, RouterLink],
  templateUrl: './product-details.html',
  styleUrl: './product-details.css',
})
export class ProductDetails implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly cart = inject(Cart);
  showCartNotification = false;
  id: string | null = null;

  product: ProductModel | undefined;

  quantity = 1;

  selectedImageIndex = 0;

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

  get productNotFound(): boolean {
    return this.product === undefined;
  }

  ngOnInit(): void {
    this.route.paramMap.subscribe((params) => {
      this.id = params.get('id');

      this.product = productsItems.find((product) => product.id === this.id);
    });
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
  if (!this.product || this.quantity <= 0) {
    return;
  }

  this.cart.addCartItem(this.product, this.quantity);

  this.showCartNotification = true;

  setTimeout(() => {
    this.showCartNotification = false;
  }, 3000);
}
  nextImage(): void {
    if (!this.product || this.product.images.length === 0) {
      return;
    }

    this.selectedImageIndex = (this.selectedImageIndex + 1) % this.product.images.length;
  }
  previousImage(): void {
    if (!this.product || this.product.images.length === 0) {
      return;
    }

    this.selectedImageIndex =
      (this.selectedImageIndex - 1 + this.product.images.length) % this.product.images.length;
  }
}
