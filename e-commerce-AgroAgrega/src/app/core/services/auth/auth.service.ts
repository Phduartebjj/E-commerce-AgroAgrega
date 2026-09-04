import { Injectable, inject, signal } from '@angular/core';
import { StorageService } from './storage.service';
import { TokenAuth } from './token.service';
import * as crypt from 'crypto-js';
import { ServiceResponse } from '@models/serviceResponse';

@Injectable({
  providedIn: 'root',
})
export class Auth {
  private Storage = inject(StorageService);
  private Token = inject(TokenAuth);

  readonly currentUserID = signal<string | null>(this.getInitialUserId());

  private getInitialUserId(): string | null {
    const id = this.Token.getId();
    return id || null;
  }

  public isLoggedIn(): boolean {
    return this.Token.checkToken();
  }

  login(email: string, password: string): boolean {
    const user = this.Storage.getUser(email);
    if (!user) return false;

    password = crypt.SHA256(password).toString();
    if (user.password !== password) return false;

    this.Token.setToken({
      id: user.id,
      name: user.name,
      email: user.email,
    });

    return true;
  }

  register(name: string, email: string, password: string): ServiceResponse {
    password = crypt.SHA256(password).toString();
    const id = crypto.randomUUID();

    const user = this.Storage.setUser({
      id,
      name,
      email,
      password,
    });

    if (!user.res) return { res: user.res, message: user.message };

    this.Token.setToken({
      id,
      name,
      email,
    });

    return { res: user.res, message: user.message };
  }

  resetPassword(email: string, newPassword: string): ServiceResponse {
    newPassword = crypt.SHA256(newPassword).toString();
    const resetPassword = this.Storage.updatePasswordUser(email, newPassword);

    return resetPassword;
  }

  updateEmail(newEmail: string): ServiceResponse {
    const response = this.Storage.updateEmailUser(this.getId(), newEmail);
    return response;
  }

  deleteAccount(id: string): void {
    this.Storage.removeUser(id);
  }

  getId(): string {
    return this.Token.getId();
  }

  getName(): string {
    return this.Token.getName();
  }

  getEmail(): string {
    return this.Token.getEmail();
  }

  updateProfile(name: string, email: string): ServiceResponse {
    const id = this.getId();
    const result = this.Storage.updateProfile(id, name, email);
    if (!result.res) return result;

    this.Token.deleteToken();
    this.Token.setToken({ id, name, email });
    return result;
  }

  logout(): void {
    this.Token.deleteToken();
    this.currentUserID.set(null);
  }

  removeAccount(): boolean {
    const id = this.getId();
    if (!id) {
      return false;
    }

    const removed = this.Storage.removeUser(id);
    if (removed) {
      this.logout();
    }

    return removed;
  }
}
