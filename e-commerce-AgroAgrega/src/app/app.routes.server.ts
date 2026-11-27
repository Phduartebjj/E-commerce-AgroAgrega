import { RenderMode, ServerRoute } from '@angular/ssr';

export const serverRoutes: ServerRoute[] = [
  // Account data and demo sessions are stored in the browser, never on the server.
  ...['admin', 'checkout', 'account', 'orders', 'orders/:id'].map((path): ServerRoute => ({
    path, renderMode: RenderMode.Client,
  })),
  {
    path: 'products/:id',
    renderMode: RenderMode.Server,
  },
  {
    path: '**',
    renderMode: RenderMode.Prerender,
  },
];
