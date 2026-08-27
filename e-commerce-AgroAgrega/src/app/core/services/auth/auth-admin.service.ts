import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class AuthAdminService {
  public isLoggedIn: boolean = false;

  LoginAdmin(usuario: string, senha: string): boolean {
    // Mock - troque depois por chamada real a uma API
    if (usuario === 'admin' && senha === 'admin123') {
      this.isLoggedIn = true;
      return true;
    }

    this.isLoggedIn = false;
    return false;
  }
}
