import { RouterLink } from '@angular/router';
import { Component, inject, InjectionToken } from '@angular/core';
import { ProductService } from '@core/services/product/product.service';
import { PrecoFormatadoPipe } from '../../../../shared/pipes/preco-formatado-pipe';
import { Cart } from '@core/services/cart/cart.service';
import { ProductModel } from '@models/product';

@Component({
  selector: 'app-product-carousel',
  imports: [RouterLink, PrecoFormatadoPipe],
  templateUrl: './product-carousel.html',
  styleUrl: './product-carousel.css',
})
export class ProductCarousel {
adicionarAoCarrinho(_t9: ProductModel) {
throw new Error('Method not implemented.');
}
  private cart = inject(Cart);
  private productService = 
  inject(ProductService);
  adicionarAoCariinho(produto: ProductModel): void{
    this.cart.addCartItem(produto);
  }

  produtos = this.productService.getProducts();
}
