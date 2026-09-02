import { Injectable } from '@angular/core';
import { ServiceResponse } from '@models/serviceResponse';
import { UserModel } from '@models/user';

@Injectable({
  providedIn: 'root',
})
export class StorageService {
  //Seta os usúarios se baseando no modelo User.
  setUser(data: UserModel): ServiceResponse {
    try {
      const dtLocal = localStorage.getItem('db');

      if (!dtLocal) {
        localStorage.setItem('db', JSON.stringify([data]));
        return { res: true, message: '' };
      }

      if (this.getUser(data.email)) return { res: false, message: 'Email Já Cadastrado!' };

      const users: UserModel[] = JSON.parse(dtLocal);
      users.push(data);
      localStorage.setItem('db', JSON.stringify(users));

      return { res: true, message: '' };
    } catch (e) {
      console.error('Erro ao salvar no localStorage', e);
      return { res: false, message: '' };
    }
  }

  //Busca usuário pelo email | poderia ser pelo ID
  getUser(email: string): UserModel | null {
    try {
      const data = localStorage.getItem('db');
      if (!data) return null;

      const users: UserModel[] = JSON.parse(data);
      return users.find((user) => user.email === email) ?? null;
    } catch (e) {
      console.error('Erro ao ler do localStorage', e);
      return null;
    }
  }

  // Retorna todos os usuários
  getAllUsers(): UserModel[] | string {
    const data = localStorage.getItem('db');
    if (!data) return [];

    return data;
  }

  // Atualiza usuário
  updatePasswordUser(email: string, newPassword: string): ServiceResponse {
    try {
      const data = localStorage.getItem('db');

      if (!data) return { res: false, message: 'Database not found' };

      const users: UserModel[] = JSON.parse(data);
      const user = users.find((user) => user.email === email);

      if (!user) return { res: false, message: 'User not found' };
      user.password = newPassword;

      localStorage.setItem('db', JSON.stringify(users));
      return { res: true, message: '' };
    } catch (err) {
      console.error('Erro ao atualizar usuário', err);
      return { res: false, message: '' };
    }
  }

  updateEmailUser(id: string, newEmail: string): ServiceResponse {
    try {
      const data = localStorage.getItem('db');

      if (!data) return { res: false, message: 'Database not found' };

      const users: UserModel[] = JSON.parse(data);
      const user = users.find((user) => user.id === id);

      if (!user) return { res: false, message: 'User not found' };
      user.email = newEmail;

      localStorage.setItem('db', JSON.stringify(users));
      return { res: true, message: '' };
    } catch (err) {
      console.error('Erro ao atualizar usuário', err);
      return { res: false, message: '' };
    }
  }

  updateProfile(id: string, name: string, email: string): ServiceResponse {
    try {
      const data = localStorage.getItem('db');
      if (!data) return { res: false, message: 'Database not found' };

      const users: UserModel[] = JSON.parse(data);
      const user = users.find((item) => item.id === id);
      if (!user) return { res: false, message: 'User not found' };

      const emailInUse = users.some((item) => item.email === email && item.id !== id);
      if (emailInUse) return { res: false, message: 'Email Já Cadastrado!' };

      user.name = name;
      user.email = email;
      localStorage.setItem('db', JSON.stringify(users));
      return { res: true, message: '' };
    } catch (error) {
      console.error('Erro ao atualizar perfil', error);
      return { res: false, message: '' };
    }
  }

  removeUser(id: string): boolean {
    const data = localStorage.getItem('db');

    if (!data || !id) {
      return false;
    }

    try {
      const users: UserModel[] = JSON.parse(data);
      const originalLength = users.length;
      const remainingUsers = users.filter((user) => user.id !== id);

      if (remainingUsers.length === originalLength) {
        return false;
      }

      localStorage.setItem('db', JSON.stringify(remainingUsers));
      return true;
    } catch (error) {
      console.error('Erro ao remover usuário', error);
      return false;
    }
  }

  clear(): void {
    localStorage.clear();
  }
}