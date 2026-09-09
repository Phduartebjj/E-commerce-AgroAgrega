import { provideRouter } from '@angular/router';
import { render, screen } from '@testing-library/angular';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { Cart } from '@core/services/cart/cart.service';
import type { ProductModel } from '@models/product';

import { ProductCarousel } from './product-carousel';

const produtoMock: ProductModel = {
  id: 'produto-1',
  title: 'Semente de milho AgroAgrega',
  description: 'Semente selecionada para alta produtividade.',
  category: 'Insumos',
  price: 129.9,
  images: ['/assets/images/semente-milho.png'],
  rating: 4.8,
  brand: 'Biomatrix',
};

describe('ProductCarousel - Angular Testing Library', () => {
  it('deve mostrar o aviso depois que o usuário adicionar o produto', async () => {
    const user = userEvent.setup();

    await render(ProductCarousel, {
      inputs: { produtos: [produtoMock] },
      providers: [{ provide: Cart, useValue: { addCartItem: vi.fn() } }, provideRouter([])],
    });

    const botao = screen.getByRole('button', {
      name: 'Adicionar ao Carrinho',
    });

    await user.click(botao);

    expect(await screen.findByRole('button', { name: 'Adicionado ✓' })).not.toBeNull();
  });
});
