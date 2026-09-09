import { ElementRef } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { describe, expect, it, vi } from 'vitest';

import { Cart } from '@core/services/cart/cart.service';

import { ProductCarousel } from './product-carousel';

describe('ProductCarousel - caixa branca com Vitest', () => {
  it('deve habilitar somente a seta esquerda no final do carrossel', () => {
    const cartMock = { addCartItem: vi.fn() };

    TestBed.configureTestingModule({
      imports: [ProductCarousel],
      providers: [{ provide: Cart, useValue: cartMock }, provideRouter([])],
    });

    const fixture = TestBed.createComponent(ProductCarousel);
    const component = fixture.componentInstance;

    component.productsList = new ElementRef({
      scrollLeft: 700,
      scrollWidth: 1000,
      clientWidth: 300,
    } as HTMLDivElement);

    component.atualizarSetas();

    expect(component.podeRolarEsquerda()).toBe(true);
    expect(component.podeRolarDireita()).toBe(false);
  });
});
