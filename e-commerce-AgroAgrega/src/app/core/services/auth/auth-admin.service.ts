import { Injectable } from '@angular/core';
import * as crypt from 'crypto-js';
import UserDb from '@mocks/users.json';

@Injectable({ providedIn: 'root' })
export class AuthAdminService {
  private readonly passwordKey = 'agroagrega-admin-passwords';
  private currentUser = typeof sessionStorage === 'undefined' ? '' : sessionStorage.getItem('agroagrega-admin-user') ?? '';
  private loggedIn = UserDb.some((user) => user.name === this.currentUser);

  get isLoggedIn(): boolean { return this.loggedIn; }
  set isLoggedIn(value: boolean) {
    this.loggedIn = value;
    if (!value) {
      this.currentUser = '';
      if (typeof sessionStorage !== 'undefined') sessionStorage.removeItem('agroagrega-admin-user');
    }
  }

  private passwords(): Record<string, string> {
    try { return JSON.parse(localStorage.getItem(this.passwordKey) ?? '{}'); }
    catch { return {}; }
  }

  private validPassword(name: string, password: string): boolean {
    const user = UserDb.find((entry) => entry.name === name);
    if (!user) return false;
    const saved = this.passwords()[name];
    return saved ? saved === crypt.SHA256(password).toString() : user.password === password;
  }

  LoginAdmin(usuario: string, senha: string): boolean {
    this.isLoggedIn = this.validPassword(usuario, senha);
    if (this.isLoggedIn) {
      this.currentUser = usuario;
      sessionStorage.setItem('agroagrega-admin-user', usuario);
    }
    return this.isLoggedIn;
  }

  changePassword(current: string, next: string): boolean {
    if (!this.isLoggedIn || next.length < 6 || !this.validPassword(this.currentUser, current)) return false;
    localStorage.setItem(this.passwordKey, JSON.stringify({ ...this.passwords(), [this.currentUser]: crypt.SHA256(next).toString() }));
    return true;
  }
}
