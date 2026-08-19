import { Injectable, inject } from '@angular/core';
import { StorageService } from './storage-service.service';
import { TokenAuth } from './token-auth.service';
// import { randomUUID } from 'crypto';

@Injectable({
  providedIn: 'root',
})
export class Auth {
  private Storage = inject(StorageService);
  private Token = inject(TokenAuth);
  public isLoggedIn: boolean = false; 

  // public validInput = (name: string, email: string, password: string): boolean => {
  //     const inpt = {name, email, password};
  //     const rgx = {
  //         name: /^[a-zA-Z]{3,16}$/,
  //         email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  //         password: /^.{8,}$/
  //     }

  //     return false;
  // }

  async login(email: string, password: string){
    
  }

  async register(name: string, email: string, password: string){
      const user = {
        id: self.crypto.randomUUID(),
        name,
        email,
        password,
      };

      const userHasCreated = this.Storage.setUser(user);

      if(userHasCreated){
        this.Token.setToken(user);
        this.isLoggedIn = true;
      }
  }

  logout(){
    this.Token.deleteToken();
    this.isLoggedIn = false;
  }
}
