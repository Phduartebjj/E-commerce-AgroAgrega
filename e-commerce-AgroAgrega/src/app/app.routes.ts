import { Routes } from '@angular/router';

import { Home } from './features/home/home';
import { Products } from './features/products/products';
import { ProductDetails } from './features/product-details/product-details';
import { CartComponent } from './features/cart/cart';

import { Login } from './features/auth/login/login';
import { Register } from './features/auth/register/register';
import { ForgotPassword } from './features/auth/forgot-password/forgot-password';
import { ResetPassword } from './features/auth/reset-password/reset-password';

import { Checkout } from './features/checkout/checkout';

import { Orders } from './features/orders/orders/orders';
import { OrderDetails } from './features/orders/order-details/order-details';

export const routes: Routes = [
  {
    path: '',
    component: Home,
  },
  {
    path: 'products',
    component: Products,
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
  },
  {
    path: 'register',
    component: Register,
  },
  {
    path: 'forgot-password',
    component: ForgotPassword,
  },
  {
    path: 'reset-password',
    component: ResetPassword,
  },
  {
    path: 'checkout',
    component: Checkout,
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
