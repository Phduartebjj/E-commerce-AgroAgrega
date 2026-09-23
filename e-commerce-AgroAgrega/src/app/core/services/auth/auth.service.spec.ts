import { TestBed } from '@angular/core/testing';
import { describe, it, expect, vi } from 'vitest';
import { Auth } from './auth.service';
import { StorageService } from './storage.service';
import { TokenAuth } from './token.service';
import { SHA256 } from 'crypto-js';
import { UserModel } from '@models/user';

describe('Teste de autenticação', () => {
  it('Deve retornar true se login for efetuado com sucesso', () => {
    const user: UserModel = {
      id: '1',
      name: 'John',
      email: 'john@email.com',
      password: SHA256('123456').toString(),
    }; // Cria uma varíavel de usuário

    const storageMock = {
      getUser: vi.fn().mockReturnValue(user),
    }; // Cria um storage falso para o teste
                          // ambos são necessários para o Auth, já que são utilizados no login
    const tokenMock = {
      getId: vi.fn().mockReturnValue(''),
      checkToken: vi.fn().mockReturnValue(false),
      setToken: vi.fn(),
    }; // Cria um token falso para o teste

    TestBed.configureTestingModule({
      providers: [
        Auth,
        { provide: StorageService, useValue: storageMock },
        { provide: TokenAuth, useValue: tokenMock },
      ],
    });

    const auth = TestBed.inject(Auth);

    const result = auth.login('john@email.com', '123456');

    expect(result).toBe(true);
  });

  it('deve rejeitar usuário inexistente e senha incorreta', () => {
    const storageMock = { getUser: vi.fn().mockReturnValue(null) };
    const tokenMock = { getId: vi.fn().mockReturnValue(''), checkToken: vi.fn() };
    TestBed.configureTestingModule({
      providers: [
        Auth,
        { provide: StorageService, useValue: storageMock },
        { provide: TokenAuth, useValue: tokenMock },
      ],
    });
    const auth = TestBed.inject(Auth);

    expect(auth.login('missing@example.com', '123456')).toBe(false);
    storageMock.getUser.mockReturnValue({
      id: '1',
      name: 'John',
      email: 'john@email.com',
      password: SHA256('other').toString(),
    });
    expect(auth.login('john@email.com', '123456')).toBe(false);
  });

  it('deve registrar usuário e tratar falha de persistência', () => {
    const storageMock = {
      getUser: vi.fn(),
      setUser: vi.fn().mockReturnValue({ res: true, message: 'ok' }),
    };
    const tokenMock = { getId: vi.fn().mockReturnValue(''), setToken: vi.fn() };
    TestBed.configureTestingModule({
      providers: [
        Auth,
        { provide: StorageService, useValue: storageMock },
        { provide: TokenAuth, useValue: tokenMock },
      ],
    });
    const auth = TestBed.inject(Auth);

    expect(auth.register('Jane', 'jane@example.com', 'secret')).toEqual({
      res: true,
      message: 'ok',
    });
    expect(tokenMock.setToken).toHaveBeenCalledWith({
      id: expect.any(String),
      name: 'Jane',
      email: 'jane@example.com',
    });

    storageMock.setUser.mockReturnValue({ res: false, message: 'duplicado' });
    expect(auth.register('Jane', 'jane@example.com', 'secret')).toEqual({
      res: false,
      message: 'duplicado',
    });
  });

  it('deve delegar perfil, reset, logout e remoção da conta', () => {
    const storageMock = {
      updatePasswordUser: vi.fn().mockReturnValue({ res: true, message: '' }),
      updateEmailUser: vi.fn().mockReturnValue({ res: true, message: '' }),
      updateProfile: vi.fn().mockReturnValue({ res: true, message: '' }),
      removeUser: vi.fn().mockReturnValue(true),
    };
    const tokenMock = {
      getId: vi.fn().mockReturnValue('user-1'),
      getName: vi.fn().mockReturnValue('John'),
      getEmail: vi.fn().mockReturnValue('john@example.com'),
      checkToken: vi.fn().mockReturnValue(true),
      setToken: vi.fn(),
      deleteToken: vi.fn(),
    };
    TestBed.configureTestingModule({
      providers: [
        Auth,
        { provide: StorageService, useValue: storageMock },
        { provide: TokenAuth, useValue: tokenMock },
      ],
    });
    const auth = TestBed.inject(Auth);

    expect(auth.isLoggedIn()).toBe(true);
    expect(auth.getId()).toBe('user-1');
    expect(auth.getName()).toBe('John');
    expect(auth.getEmail()).toBe('john@example.com');
    expect(auth.resetPassword('john@example.com', 'new-secret').res).toBe(true);
    expect(auth.updateEmail('new@example.com').res).toBe(true);
    expect(auth.updateProfile('Johnny', 'profile@example.com').res).toBe(true);
    expect(auth.removeAccount()).toBe(true);
    expect(tokenMock.deleteToken).toHaveBeenCalled();
    auth.logout();
    expect(auth.currentUserId()).toBeNull();
  });

  it('deve retornar falso ao remover conta sem usuário', () => {
    const tokenMock = { getId: vi.fn().mockReturnValue('') };
    TestBed.configureTestingModule({
      providers: [Auth, { provide: StorageService, useValue: {} }, { provide: TokenAuth, useValue: tokenMock }],
    });

    expect(TestBed.inject(Auth).removeAccount()).toBe(false);
  });
});