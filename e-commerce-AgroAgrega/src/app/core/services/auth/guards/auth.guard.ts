import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

import { Auth } from '../auth.service';
export const authGuard: CanActivateFn = (route, state) => {
  if (typeof window === 'undefined') {
    return true;
  }
  const authService = inject(Auth);
  const router = inject(Router);

  const loggedIn = authService.isLoggedIn();

  if (loggedIn) {
    return true;
  }

  return router.createUrlTree(['/login'], {
    queryParams: {
      returnUrl: state.url,
    },
  });
};
