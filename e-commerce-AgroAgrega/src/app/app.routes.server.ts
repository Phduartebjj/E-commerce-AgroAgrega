import { RenderMode, ServerRoute, PrerenderFallback } from '@angular/ssr';
import { productsItems } from './core/data/products';
import { additionalProducts } from './core/data/additional-products';

export const serverRoutes: ServerRoute[] = [
  // Account data and demo sessions are stored in the browser, never on the server.
  ...['admin', 'checkout', 'account', 'orders', 'orders/:id'].map((path): ServerRoute => ({
    path, renderMode: RenderMode.Client,
  })),
  {
    path: 'products/:id',
    renderMode: RenderMode.Prerender,
    async getPrerenderParams() {
      const all = [...productsItems, ...additionalProducts];
      return all.map((p) => ({ id: p.id }));
    },
    fallback: PrerenderFallback.Client,
  },
  {
    path: '**',
    renderMode: RenderMode.Prerender,
  },
];
