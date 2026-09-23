import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';
import { AuthAdminService } from './auth-admin.service';

describe('AuthAdminService', () => {
  it('deve aceitar e rejeitar credenciais administrativas', () => {
    TestBed.configureTestingModule({ providers: [AuthAdminService] });
    const service = TestBed.inject(AuthAdminService);

    expect(service.LoginAdmin('admin', 'admin')).toBe(true);
    expect(service.isLoggedIn).toBe(true);
    expect(service.LoginAdmin('admin', 'senha-incorreta')).toBe(false);
    expect(service.isLoggedIn).toBe(false);
  });
});