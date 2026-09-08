import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

import { Auth } from '../auth.service';

export const guestGuard: CanActivateFn = () => {
  const authService = inject(Auth);
  const router = inject(Router);

  const loggedIn = authService.isLoggedIn();
  if (!loggedIn) {
    return true;
  }

  return router.createUrlTree(['/']);
};
