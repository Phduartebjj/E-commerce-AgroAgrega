import { Injectable, inject } from '@angular/core';
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

  public isLoggedIn(): boolean{
    return this.Token.checkToken();
  }

  login(email: string, password: string): boolean{
    const user = this.Storage.getUser(email); 
    if(!user) return false;

    password = crypt.SHA256(password).toString();
    if(user.password !== password) return false
    
    this.Token.setToken({
      id: user.id,
      name: user.name,
      email: user.email
    });
       
    return true;
  }

  register(name: string, email: string, password: string): ServiceResponse{
      password = crypt.SHA256(password).toString();
      const id = crypto.randomUUID();

      const user = this.Storage.setUser({
        id,
        name,
        email,
        password
      });

      if(!user.res) return {res: user.res, message: user.message};

      this.Token.setToken({
        id,
        name,
        email
      });

      return {res: user.res, message: user.message};
  }

  getId(): string{
    return this.Token.getId();
  }
  getName(): string{
    return this.Token.getName();
  }

  logout(){
    this.Token.deleteToken();
  }
}
