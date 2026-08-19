import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

import { Auth } from './auth.service';

export const authGuard: CanActivateFn = () => {
    const authService = inject(Auth);
    const router = inject(Router);

    if (authService.isLoggedIn) {
        return true;
    }

    return router.createUrlTree(['/login']);
};