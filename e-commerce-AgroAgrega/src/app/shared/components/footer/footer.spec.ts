import { render, screen } from '@testing-library/angular';
import { provideRouter } from '@angular/router';

import { Footer } from './footer';

describe('Footer', () => {
  it('deve exibir os títulos h3 do rodapé', async () => {
    await render(Footer, {
      providers: [provideRouter([])],
    });

    const titulos = screen.getAllByRole('heading', {
      level: 3,
    });

    expect(titulos.length).toBe(3);

    expect(
      screen.getByRole('heading', {
        level: 3,
        name: 'Nossas Categorias',
      }),
    ).toBeTruthy();

    expect(
      screen.getByRole('heading', {
        level: 3,
        name: 'Institucional',
      }),
    ).toBeTruthy();

    expect(
      screen.getByRole('heading', {
        level: 3,
        name: 'Contato & Suporte',
      }),
    ).toBeTruthy();
  });
});