import { TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { UserModel } from '@models/user';
import { StorageService } from './storage.service';

describe('StorageService', () => {
  let service: StorageService;

  const user: UserModel = {
    id: 'user-1',
    name: 'Cliente',
    email: 'cliente@example.com',
    password: 'hash',
  };

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({});
    service = TestBed.inject(StorageService);
  });

  it('deve criar e buscar um usuário', () => {
    expect(service.setUser(user)).toEqual({ res: true, message: '' });
    expect(service.getUser(user.email)).toEqual(user);
    expect(service.getAllUsers()).toContain(user.email);
  });

  it('deve rejeitar email duplicado', () => {
    service.setUser(user);

    expect(service.setUser({ ...user, id: 'user-2' })).toEqual({
      res: false,
      message: 'Email Já Cadastrado!',
    });
  });

  it('deve atualizar senha, email e perfil', () => {
    service.setUser(user);

    expect(service.updatePasswordUser(user.email, 'new-hash').res).toBe(true);
    expect(service.getUser(user.email)?.password).toBe('new-hash');
    expect(service.updateEmailUser(user.id, 'novo@example.com').res).toBe(true);
    expect(service.updateProfile(user.id, 'Novo Nome', 'perfil@example.com').res).toBe(true);
    expect(service.getUser('perfil@example.com')).toMatchObject({
      id: user.id,
      name: 'Novo Nome',
    });
  });

  it('deve informar erros para banco ausente e usuário inexistente', () => {
    expect(service.updatePasswordUser(user.email, 'hash')).toEqual({
      res: false,
      message: 'Database not found',
    });
    expect(service.updateEmailUser(user.id, 'novo@example.com')).toEqual({
      res: false,
      message: 'Database not found',
    });
    expect(service.updateProfile(user.id, user.name, user.email)).toEqual({
      res: false,
      message: 'Database not found',
    });
    expect(service.removeUser(user.id)).toBe(false);
  });

  it('deve impedir perfil inexistente ou email já usado', () => {
    const otherUser = { ...user, id: 'user-2', email: 'outro@example.com' };
    service.setUser(user);
    service.setUser(otherUser);

    expect(service.updateProfile('missing', 'Nome', 'missing@example.com')).toEqual({
      res: false,
      message: 'User not found',
    });
    expect(service.updateProfile(user.id, 'Nome', otherUser.email)).toEqual({
      res: false,
      message: 'Email Já Cadastrado!',
    });
    expect(service.updatePasswordUser('missing@example.com', 'hash')).toEqual({
      res: false,
      message: 'User not found',
    });
  });

  it('deve remover usuário e tratar dados inválidos', () => {
    service.setUser(user);
    expect(service.removeUser(user.id)).toBe(true);
    expect(service.getUser(user.email)).toBeNull();
    expect(service.removeUser(user.id)).toBe(false);

    localStorage.setItem('db', '{invalid');
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    expect(service.getUser(user.email)).toBeNull();
    expect(service.removeUser(user.id)).toBe(false);
    consoleError.mockRestore();
  });
});