import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

import { AuthAdminService as Admin} from '../auth-admin.service';

export const authAdminGuard: CanActivateFn = (route, state) => {
    const authService = inject(Admin);
    const router = inject(Router);

    if (authService.isLoggedIn){ 
        return true;
    }
    return router.createUrlTree(['/admin/login']);
};