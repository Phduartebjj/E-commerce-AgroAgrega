import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';
import { AuthAdminService } from './auth-admin.service';

// Verifica a validação das credenciais usadas no acesso administrativo.
describe('AuthAdminService', () => {
  beforeEach(() => { localStorage.clear(); sessionStorage.clear(); });
  afterEach(() => { localStorage.clear(); sessionStorage.clear(); });
  it('deve aceitar e rejeitar credenciais administrativas', () => {
    TestBed.configureTestingModule({ providers: [AuthAdminService] });
    const service = TestBed.inject(AuthAdminService);

    expect(service.LoginAdmin('admin', 'admin')).toBe(true);
    expect(service.isLoggedIn).toBe(true);
    expect(service.LoginAdmin('admin', 'senha-incorreta')).toBe(false);
    expect(service.isLoggedIn).toBe(false);
  });
  it('persiste a nova senha e conserva a sessão no recarregamento', () => {
    TestBed.configureTestingModule({ providers: [AuthAdminService] });
    const service = TestBed.inject(AuthAdminService);
    service.LoginAdmin('admin', 'admin');
    expect(service.changePassword('incorreta', 'senha-nova')).toBe(false);
    expect(service.changePassword('admin', 'senha-nova')).toBe(true);
    const restored = new AuthAdminService();
    expect(restored.isLoggedIn).toBe(true);
    expect(restored.LoginAdmin('admin', 'admin')).toBe(false);
    expect(restored.LoginAdmin('admin', 'senha-nova')).toBe(true);
  });
});
