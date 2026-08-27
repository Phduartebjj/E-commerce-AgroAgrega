import { RouterLink } from '@angular/router';
import { Component, inject, ElementRef, ViewChild,signal,AfterViewInit } from '@angular/core';
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
export class ProductCarousel implements AfterViewInit {
  produtoAdicionadoId = signal<ProductModel['id'] | null>(null);;

  ngAfterViewInit(): void {
    this.atualizarSetas();
  }


  atualizarSetas(): void{
    const lista =  this.productsList.nativeElement;

    this.podeRolarEsquerda.set(lista.scrollLeft>0);

    this.podeRolarDireita.set(lista.scrollLeft+lista.clientWidth < lista.scrollWidth - 1);
  }
  podeRolarEsquerda = signal(false);
  podeRolarDireita = signal(true);
  @ViewChild('productsList')
  productsList!: ElementRef<HTMLDivElement>;
  private cart = inject(Cart);
  private productService = inject(ProductService);
  adicionarAoCarrinho(produto: ProductModel): void {
    this.cart.addCartItem(produto);

  this.produtoAdicionadoId.set(produto.id);

  setTimeout(() => {
    this.produtoAdicionadoId.set(null);
    }, 2000);
  }

  produtos = this.productService.getProducts();

  rolarEsquerda(): void {
    this.productsList.nativeElement.scrollBy({
      left: -300,
      behavior: 'smooth',
    });
  }

  rolarDireita(): void {
    this.productsList.nativeElement.scrollBy({
      left: 300,
      behavior: 'smooth',
    });
  }
}
