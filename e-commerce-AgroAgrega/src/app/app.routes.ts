import { Routes } from '@angular/router';

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
    data: { hideFooter: true, hideHeader: true },
  },
  {
    path: 'register',
    component: Register,
    data: { hideHeader: true },
  },
  {
    path: 'forgot-password',
    component: ForgotPassword,
    data: { hideHeader: true },
  },
  {
    path: 'reset-password',
    component: ResetPassword,
    data: { hideHeader: true },
  },
  {
    path: 'checkout',
    component: CheckoutComponent,
  },
  {
    path: 'orders',
    component: Orders,
  },
  {
    path: 'orders/:id',
    component: OrderDetails,
  },
];
