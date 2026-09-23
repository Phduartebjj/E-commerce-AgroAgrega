import { Routes } from '@angular/router';

import { authGuard, guestGuard, authAdminGuard } from '@core/services/auth/guards/';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./features/home/home').then((module) => module.Home),
  },

  {
    path: 'products',
    loadComponent: () =>
      import('./features/products/products').then((module) => module.ProductsComponent),
  },

  {
    path: 'products/:id',
    loadComponent: () =>
      import('./features/product-details/product-details').then((module) => module.ProductDetails),
  },

  {
    path: 'coupons',
    loadComponent: () =>
      import('./features/store-benefits/store-benefits').then(
        (module) => module.StoreBenefitsComponent,
      ),
    data: { storeBenefitMode: 'coupons' },
  },

  {
    path: 'agro-plus',
    loadComponent: () =>
      import('./features/store-benefits/store-benefits').then(
        (module) => module.StoreBenefitsComponent,
      ),
    data: { storeBenefitMode: 'agroPlus' },
  },

  {
    path: 'cart',
    loadComponent: () => import('./features/cart/cart').then((module) => module.CartComponent),
  },

  {
    path: 'login',
    loadComponent: () => import('./features/auth/login/login').then((module) => module.Login),
    canActivate: [guestGuard],
    data: {
      hideFooter: true,
      hideHeader: true,
    },
  },

  {
    path: 'register',
    loadComponent: () => import('./features/auth/register/register').then((module) => module.Register),
    canActivate: [guestGuard],
    data: {
      hideFooter: true,
      hideHeader: true,
    },
  },

  {
    path: 'forgot-password',
    loadComponent: () =>
      import('./features/auth/forgot-password/forgot-password').then(
        (module) => module.ForgotPassword,
      ),
    canActivate: [guestGuard],
    data: {
      hideFooter: true,
      hideHeader: true,
    },
  },

  {
    path: 'reset-password',
    canActivate: [guestGuard],
    loadComponent: () =>
      import('./features/auth/reset-password/reset-password').then(
        (module) => module.ResetPassword,
      ),
    data: {
      hideFooter: true,
      hideHeader: true,
    },
  },

  {
    path: 'checkout',
    loadComponent: () =>
      import('./features/checkout/checkout').then((module) => module.CheckoutComponent),
    canActivate: [authGuard],
  },

  {
    path: 'orders',
    loadComponent: () => import('./features/orders/orders/orders').then((module) => module.Orders),
    canActivate: [authGuard],
  },

  {
    path: 'about',
    loadComponent: () =>
      import('./features/about-us/about-us').then((module) => module.AboutUsComponent),
  },

  {
    path: 'orders/:id',
    loadComponent: () =>
      import('./features/orders/order-details/order-details').then((module) => module.OrderDetails),
  },

  {
    path: 'account',
    loadComponent: () =>
      import('./features/minha-conta/minha-conta').then((module) => module.MinhaConta),
    canActivate: [authGuard],
  },

  {
    path: 'admin/login',
    loadComponent: () =>
      import('./features/admin/login/login').then((module) => module.AdminLoginComponent),
    data: { hideFooter: true, hideHeader: true },
  },

  {
    path: 'admin',
    canActivate: [authAdminGuard],
    loadComponent: () => import('./features/admin/admin').then((module) => module.AdminComponent),
    data: { hideFooter: true, hideHeader: true },
  },

  {
    path: '**',
    loadComponent: () =>
      import('./features/not-found/not-found').then((module) => module.NotFoundComponent),
  },
];
