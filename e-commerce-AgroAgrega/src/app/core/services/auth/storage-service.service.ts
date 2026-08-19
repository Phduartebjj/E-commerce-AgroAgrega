import { Injectable } from '@angular/core';
import { UserModel } from '@models/user';

@Injectable({
  providedIn: 'root'
})
export class StorageService{
  //Seta os usúarios se baseando no modelo User.
  setUser(data: UserModel): boolean {
    try{
        const dtLocal = localStorage.getItem('db');
        // Se não existir usuário, ele sobe o valor como primeiro item de um vetor.
        if(!dtLocal){
            localStorage.setItem('db', JSON.stringify([data]));
            return true;
        }

        //Utiliza do método getUser para checar se já existe algum usuário.        
        if(this.getUser(data.email)) return false
        
        const users: UserModel[] = JSON.parse(dtLocal); // 'dtLocal ?? "" ' se o dtLocal retornar undefined/null ele usa o outro valor. 
        users.push(data);
        localStorage.setItem('db', JSON.stringify(users));

        return true;
    }catch(e){
        console.error('Erro ao salvar no localStorage', e);
        return false;
    }
  }

  //Busca usuário pelo email | poderia ser pelo ID
  getUser(email: string): UserModel | null {
    try{
      const data = localStorage.getItem('db');
      if(!data){
        return null;
      }
      const users: UserModel[] = JSON.parse(data);

      return users.find(user => user.email === email) ?? null;
    }catch(e){
      console.error('Erro ao ler do localStorage', e);
      return null;
    }
  }

  // Retorna todos os usuários
  getAllUsers(): UserModel[] | string{
    const data = localStorage.getItem('db');
    if(!data) return [];

    return data;
  }

  // Atualiza usuário
  updateUser(email: string, newPassword: string): boolean {
      try {
        const data = localStorage.getItem('db');
        if(!data) return false;
          const users: UserModel[] = JSON.parse(data);
          const user = users.find(user => user.email === email);

          if(!user) return false;
          user.password = newPassword;

          localStorage.setItem('db', JSON.stringify(users));
          return true;
      } catch (err) {
          console.error('Erro ao atualizar usuário', err);
          return false;
      }
  }

  // removeUser(key: string): void {
  //   localStorage.removeItem(key);
  // }

  clear(): void {
    localStorage.clear();
  }
}