import { RenderMode, ServerRoute, PrerenderFallback } from '@angular/ssr';
import { productsItems } from './core/data/products';
import { additionalProducts } from './core/data/additional-products';

export const serverRoutes: ServerRoute[] = [
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
    path: 'orders/:id',
    renderMode: RenderMode.Client,
  },
  {
    path: '**',
    renderMode: RenderMode.Prerender,
  },
];
