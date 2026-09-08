import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class AuthAdminService {
  public isLoggedIn: boolean = false;

  LoginAdmin(usuario: string, senha: string): boolean {
    if (usuario === 'admin' && senha === 'admin123') {
      this.isLoggedIn = true;
      return true;
    }

    this.isLoggedIn = false;
    return false;
  }
}
