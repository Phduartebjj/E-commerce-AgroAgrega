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

  async login(email: string, password: string){
    
  }

  async register(name: string, email: string, password: string){
      if(name === "" || !name.match("^[a-zA-Z]{3,16}$)")) throw new Error()
    
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
