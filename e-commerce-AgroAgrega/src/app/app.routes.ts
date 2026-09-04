import { Routes } from '@angular/router';

import { NotFoundComponent } from './features/not-found/not-found';
import { Home } from './features/home/home';
import { ProductsComponent } from './features/products/products';
import { ProductDetails } from './features/product-details/product-details';
import { CartComponent } from './features/cart/cart';
import { Login } from './features/auth/login/login';
import { Register } from './features/auth/register/register';
import { ForgotPassword } from './features/auth/forgot-password/forgot-password';
import { ResetPassword } from './features/auth/reset-password/reset-password';
import { CheckoutComponent } from './features/checkout/checkout';
import { Orders } from './features/orders/orders/orders';
import { OrderDetails } from './features/orders/order-details/order-details';
import { AboutUsComponent } from '@features/about-us/about-us';
import { authGuard, guestGuard, authAdminGuard } from '@core/services/auth/guards/';
import { MinhaConta } from './features/minha-conta/minha-conta';
import { AdminLoginComponent } from './features/admin/login/login';
import { AdminComponent } from '@features/admin/admin';

export const routes: Routes = [
  {
    path: '',
    component: Home,
  },

  {
    path: 'products',
    component: ProductsComponent,
  },

  {
    path: 'products/:id',
    component: ProductDetails,
  },

  {
    path: 'cart',
    component: CartComponent,
  },

  {
    path: 'login',
    component: Login,
    canActivate: [guestGuard],
    data: {
      hideFooter: true,
      hideHeader: true,
    },
  },

  {
    path: 'register',
    component: Register,
    canActivate: [guestGuard],
    data: {
      hideFooter: true,
      hideHeader: true,
    },
  },

  {
    path: 'forgot-password',
    component: ForgotPassword,
    canActivate: [guestGuard],
    data: {
      hideFooter: true,
      hideHeader: true,
    },
  },

  {
    path: 'reset-password',
    canActivate: [guestGuard],
    component: ResetPassword,
    data: {
      hideFooter: true,
      hideHeader: true,
    },
  },

  {
    path: 'checkout',
    component: CheckoutComponent,
    canActivate: [authGuard],
  },

  {
    path: 'orders',
    component: Orders,
    canActivate: [authGuard],
  },

  {
    path: 'about',
    component: AboutUsComponent,
  },

  {
    path: 'orders/:id',
    component: OrderDetails,
  },

  {
    path: 'account',
    component: MinhaConta,
    canActivate: [authGuard],
  },

  {
    path: 'admin/login',
    component: AdminLoginComponent,
    data: { hideFooter: true, hideHeader: true },
  },

  {
    path: 'admin',
    canActivate: [authAdminGuard],
    component: AdminComponent,
    data: { hideFooter: true, hideHeader: true },
  },

  {
    path: '**',
    component: NotFoundComponent,
  },
];
