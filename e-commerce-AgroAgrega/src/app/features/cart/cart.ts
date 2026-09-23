import { isPlatformBrowser } from '@angular/common';
import { Component, computed, inject, PLATFORM_ID, signal } from '@angular/core';
import { Cart } from '../../core/services/cart/cart.service';
import { CartItemModel } from '../../models/cartItem';
import { ProductModel } from '../../models/product';
import { PrecoFormatadoPipe } from '../../shared/pipes/preco-formatado-pipe';
import { RouterLink } from '@angular/router';
import { productsItems } from '@core/data/products';
import { ProductCardComponent } from '../products/product-card/product-card';
import { getPartnerStoreLogo } from '../../shared/constants/partner-stores';

interface CartGroup {
  seller: string;
  items: CartItemModel[];
}

@Component({
  selector: 'app-cart',
  imports: [RouterLink, PrecoFormatadoPipe, ProductCardComponent],
  templateUrl: './cart.html',
  styleUrl: './cart.css',
})
export class CartComponent {
  private readonly cart = inject(Cart);
  private readonly platformId = inject(PLATFORM_ID);

  readonly cartItems = this.cart.getCartItems();
  readonly totalItens = this.cart.totalCartItens;
  readonly isEmpty = this.cart.isEmpty;
  readonly coupon = this.cart.coupon;
  readonly selectedItemsCount = this.cart.selectedItemsCount;
  readonly selectedSubtotal = this.cart.selectedSubtotal;
  readonly selectedOriginalSubtotal = this.cart.selectedOriginalSubtotal;
  readonly selectedProductDiscount = this.cart.selectedProductDiscount;
  readonly selectedCouponDiscount = this.cart.selectedCouponDiscount;
  readonly selectedPixDiscount = this.cart.selectedPixDiscount;
  readonly selectedPixTotal = this.cart.selectedPixTotal;
  readonly allItemsSelected = this.cart.allItemsSelected;
  readonly shareFeedback = signal('');
  readonly couponFeedback = signal('');

  readonly cartGroups = computed<CartGroup[]>(() => {
    const groups = new Map<string, CartItemModel[]>();

    for (const item of this.cartItems()) {
      const seller =
        item.product.brand && item.product.brand !== 'none' ? item.product.brand : 'AgroAgrega';
      const sellerItems = groups.get(seller) ?? [];
      sellerItems.push(item);
      groups.set(seller, sellerItems);
    }

    return [...groups.entries()].map(([seller, items]) => ({ seller, items }));
  });

  readonly recommendations = computed(() => {
    const cartIds = new Set(this.cartItems().map((item) => item.product.id));
    return productsItems.filter((product) => !cartIds.has(product.id)).slice(0, 4);
  });

  addProduct(product: ProductModel): void {
    this.cart.addCartItem(product);
  }

  applyCoupon(couponCode: string): void {
    const normalizedCode = couponCode.trim().toUpperCase();

    if (!normalizedCode) {
      this.couponFeedback.set('Digite um código de cupom.');
      return;
    }

    this.cart.applyCoupon(normalizedCode);
    this.couponFeedback.set(
      this.cart.coupon()
        ? `Cupom ${normalizedCode} aplicado com sucesso.`
        : 'Cupom inválido ou indisponível.',
    );
  }

  removeCoupon(): void {
    this.cart.removeCoupon();
    this.couponFeedback.set('Cupom removido.');
  }

  removeProduct(product: ProductModel): void {
    this.cart.removeCartItem(product);
  }

  decreaseProductQuantity(product: ProductModel): void {
    this.cart.decreaseQuantity(product);
  }

  cleanInputValue(input: HTMLInputElement): void {
    input.value = '';
  }

  clearCart(): void {
    this.cart.cleanCartItem();
  }

  isProductSelected(productId: string): boolean {
    return this.cart.isProductSelected(productId);
  }

  toggleProduct(productId: string, selected: boolean): void {
    this.cart.setProductSelected(productId, selected);
  }

  toggleGroup(group: CartGroup, selected: boolean): void {
    this.cart.setProductsSelected(
      group.items.map((item) => item.product.id),
      selected,
    );
  }

  toggleAll(selected: boolean): void {
    this.cart.selectAllItems(selected);
  }

  isGroupSelected(group: CartGroup): boolean {
    return group.items.every((item) => this.isProductSelected(item.product.id));
  }

  isGroupPartiallySelected(group: CartGroup): boolean {
    const selectedCount = group.items.filter((item) =>
      this.isProductSelected(item.product.id),
    ).length;
    return selectedCount > 0 && selectedCount < group.items.length;
  }

  getDiscountPercent(product: ProductModel): number {
    if (!product.originalPrice || product.originalPrice <= product.price) {
      return 0;
    }

    return Math.round((1 - product.price / product.originalPrice) * 100);
  }

  partnerStoreLogo(seller: string): string {
    return getPartnerStoreLogo(seller);
  }

  preventEmptyCheckout(event: Event): void {
    if (this.selectedItemsCount() === 0) {
      event.preventDefault();
    }
  }

  async shareCart(): Promise<void> {
    if (!isPlatformBrowser(this.platformId) || this.cartItems().length === 0) {
      return;
    }

    const products = this.cartItems()
      .map((item) => `${item.quantity}x ${item.product.title}`)
      .join('\n');
    const url = `${window.location.origin}/cart`;
    const text = `Meu carrinho AgroAgrega:\n${products}`;

    try {
      if (navigator.share) {
        await navigator.share({ title: 'Meu carrinho AgroAgrega', text, url });
        this.showShareFeedback('Carrinho compartilhado.');
        return;
      }

      await navigator.clipboard.writeText(`${text}\n${url}`);
      this.showShareFeedback('Link do carrinho copiado.');
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') {
        return;
      }

      this.showShareFeedback('Não foi possível compartilhar agora.');
    }
  }

  private showShareFeedback(message: string): void {
    this.shareFeedback.set(message);
    window.setTimeout(() => this.shareFeedback.set(''), 3000);
  }
}
