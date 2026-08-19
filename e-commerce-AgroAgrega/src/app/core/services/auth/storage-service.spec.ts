import { TestBed } from '@angular/core/testing';
import { StorageService } from './storage-service.service';
import { UserModel } from '@models/user';

describe('StorageService', () => {
  let service: StorageService;

  const user: UserModel = {
    id: "id aleatório",
    name: "admin",
    email: 'teste@email.com',
    password: '123456'
  };

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(StorageService);

    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('deve criar o serviço', () => {
    expect(service).toBeTruthy();
  });

  it('deve salvar um novo usuário', () => {
    service.setUser(user);

    expect(service.getUser(user.email)).toEqual(user);
  });

  it('deve buscar um usuário pelo email', () => {
    localStorage.setItem('db', JSON.stringify([user]));

    const result = service.getUser(user.email);

    expect(result).toEqual(user);
  });

  it('deve retornar null quando usuário não existir', () => {
    const result = service.getUser('naoexiste@email.com');

    expect(result).toBeNull();
  });

  it('deve retornar todos os usuários', () => {
    const users = [
      user,
      {
        email: 'outro@email.com',
        password: 'abc123'
      }
    ];

    localStorage.setItem('db', JSON.stringify(users));

    const result = service.getAllUsers();

    expect(result).toEqual(JSON.stringify(users));
  });

  it('deve limpar o localStorage', () => {
    localStorage.setItem('db', JSON.stringify([user]));

    service.clear();

    expect(localStorage.length).toBe(0);
  });
});
