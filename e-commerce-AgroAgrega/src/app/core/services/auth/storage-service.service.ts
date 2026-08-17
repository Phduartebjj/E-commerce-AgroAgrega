import { Injectable } from '@angular/core';
import { UserModel } from '@models/user';

@Injectable({
  providedIn: 'root'
})
export class StorageService{

  setUser(data: UserModel): void {
    try{
        const dtLocal = localStorage.getItem('db');

        console.log(data.email);

        if(!dtLocal){
            localStorage.setItem('db', JSON.stringify([data]));   
        }
        if(!this.getUser(data.email)){
          const users: UserModel[] = JSON.parse(dtLocal ?? "");
          localStorage.setItem('db', JSON.stringify(users));
          users.push(data);
        }
    }catch(e){
        console.error('Erro ao salvar no localStorage', e);
    }
  }

  getUser(email: string): UserModel | null {
    try{
      const item = localStorage.getItem('db');
      if(!item){
        return null;
      }
      const users: UserModel[] = JSON.parse(item);

      return users.find(user => user.email === email) ?? null;
    }catch(e){
      console.error('Erro ao ler do localStorage', e);
      return null;
    }
  }

  getAllUsers<T>(){
    return localStorage.getItem('db') ?? null;
  }

  updateUser(email: string, newPassword: string): void {
    let data = this.getUser(email);
    if(data) data.password = newPassword;

    localStorage.setItem("db", JSON.stringify(data));
  }

  removeUser(key: string): void {
    localStorage.removeItem(key);
  }

  clear(): void {
    localStorage.clear();
  }
}