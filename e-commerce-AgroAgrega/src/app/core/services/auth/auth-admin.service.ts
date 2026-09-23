import { Injectable } from '@angular/core';
import UserDb from '@mocks/users.json';

@Injectable({ providedIn: 'root' })
export class AuthAdminService {
  public isLoggedIn: boolean = false;

  LoginAdmin(usuario: string, senha: string): boolean {
    this.isLoggedIn = UserDb.some((user) => user.name === usuario && user.password === senha);
    return this.isLoggedIn;
  }
}
