import { Injectable, signal } from '@angular/core';
import { productsItems } from '../../data/products';
import { ProductCategory, ProductModel, ReviewModel } from '../../../models/product';

@Injectable({
  providedIn: 'root',
})
export class ProductService {
  private products = signal<ProductModel[]>(productsItems);

  getProducts() {
    return this.products.asReadonly();
  }

  getProductById(id: string): ProductModel | undefined {
    return this.products().find((product) => product.id === id);
  }

  getProductCategories(): ProductCategory[] {
    return ['Agricultura de Precisão', 'Irrigação', 'Pecuária', 'Insumos', 'Ferramentas'];
  }

  addReview(productId: string, review: Omit<ReviewModel, 'id'> & { id?: string }): void {
    this.products.update((currentProducts) =>
      currentProducts.map((product) => {
        if (product.id !== productId) {
          return product;
        }

        const existingReviews = product.reviews ?? [];
        const newReview: ReviewModel = {
          id: review.id ?? `rev-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
          author: review.author ?? 'Cliente AgroAgrega',
          stars: review.stars,
          text: review.text,
          createdAt: review.createdAt ?? new Date().toLocaleDateString('pt-BR'),
        };

        const updatedReviews = [newReview, ...existingReviews];
        const totalStars = updatedReviews.reduce((sum, item) => sum + item.stars, 0);
        const averageRating = Number((totalStars / updatedReviews.length).toFixed(1));

        return {
          ...product,
          rating: averageRating,
          reviews: updatedReviews,
        };
      })
    );
  }
}

