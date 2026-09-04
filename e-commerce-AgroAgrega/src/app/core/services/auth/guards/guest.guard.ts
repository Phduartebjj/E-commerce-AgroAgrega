import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

import { Auth } from '../auth.service';

export const guestGuard: CanActivateFn = () => {
  const authService = inject(Auth);
  const router = inject(Router);

  const loggedIn = authService.isLoggedIn();

  console.log('=== GUEST GUARD ===');
  console.log('URL:', router.url);
  console.log('LOGGED IN:', loggedIn);
  console.log('USER ID:', authService.getId());

  if (!loggedIn) {
    console.log('PERMITINDO LOGIN');
    return true;
  }

  console.log('REDIRECIONANDO PARA HOME');

  return router.createUrlTree(['/']);
};
