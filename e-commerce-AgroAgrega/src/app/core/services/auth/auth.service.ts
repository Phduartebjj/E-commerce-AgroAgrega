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

  public validInput = (name: string, email: string, password: string): boolean => {
      const inpt = {name, email, password};
      const rgx = {
          name: /^[a-zA-Z]{3,16}$/,
          email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
          password: /^.{8,}$/
      }

      return false;
  }

  async login(email: string, password: string){
    
  }

  async register(name: string, email: string, password: string){
    
      // this.Storage.setUser({
      //   id: randomUUID(),
      //   name,
      //   email,
      //   password
      // })
  }

  logout(){
    this.Token.deleteToken();
  }
}
