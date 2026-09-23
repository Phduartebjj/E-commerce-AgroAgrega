import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { describe, expect, it, vi } from 'vitest';
import { Auth } from '@core/services/auth/auth.service';

import { Login } from './login';

describe('Login', () => {
  let component: Login;
  let fixture: ComponentFixture<Login>;
  const authMock = { login: vi.fn() };

  beforeEach(async () => {
    authMock.login.mockReset();
    await TestBed.configureTestingModule({
      imports: [Login],
      providers: [provideRouter([]), { provide: Auth, useValue: authMock }],
    }).compileComponents();

    fixture = TestBed.createComponent(Login);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('deve validar email e senha antes de autenticar', () => {
    const event = { preventDefault: vi.fn() } as unknown as SubmitEvent;
    component.onSubmit(event);
    expect(component.emailError()).toBe('Informe seu e-mail.');

    component.loginForm.controls.email.setValue('email-invalido');
    component.onSubmit(event);
    expect(component.emailError()).toBe('Informe um e-mail válido.');

    component.loginForm.controls.email.setValue('cliente@example.com');
    component.onSubmit(event);
    expect(component.passwordError()).toBe('Informe sua senha.');
  });

  it('deve sanitizar dados, exibir erro e navegar após login', () => {
    authMock.login.mockReturnValue(false);
    const event = { preventDefault: vi.fn() } as unknown as SubmitEvent;
    component.loginForm.setValue({
      email: ' Cliente @Example.com ',
      password: ' senha ',
      remember: true,
    });

    component.onSubmit(event);
    expect(authMock.login).toHaveBeenCalledWith('cliente@example.com', 'senha');
    expect(component.loginError()).toBe('E-mail ou senha inválidos.');
    component.togglePassword();
    expect(component.showPassword()).toBe(true);
    component.onPasswordInput();
    expect(component.loginError()).toBe('');
  });

  it('deve alternar senha somente quando houver valor e limpar erros', () => {
    component.togglePassword();
    expect(component.showPassword()).toBe(false);
    component.loginError.set('erro');
    component.passwordError.set('erro');
    component.clearErrors();
    expect(component.loginError()).toBe('');
    expect(component.passwordError()).toBe('');
  });
});
