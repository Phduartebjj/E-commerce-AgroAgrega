import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, provideRouter } from '@angular/router';
import { describe, expect, it, vi } from 'vitest';
import { Auth } from '@core/services/auth/auth.service';

import { ResetPassword } from './reset-password';

describe('ResetPassword', () => {
  let component: ResetPassword;
  let fixture: ComponentFixture<ResetPassword>;
  const authMock = { resetPassword: vi.fn() };

  beforeEach(async () => {
    authMock.resetPassword.mockReset();
    await TestBed.configureTestingModule({
      imports: [ResetPassword],
      providers: [
        provideRouter([]),
        { provide: Auth, useValue: authMock },
        { provide: ActivatedRoute, useValue: { snapshot: { queryParamMap: new URLSearchParams() } } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ResetPassword);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('deve validar senha e confirmação', () => {
    const event = { preventDefault: vi.fn() } as unknown as SubmitEvent;
    component.onSubmit(event);
    expect(component.passwordError()).toBe('Informe uma nova senha.');

    component.resetForm.controls.password.setValue('123');
    component.resetForm.controls.passwordConfirmation.setValue('123');
    component.onSubmit(event);
    expect(component.passwordError()).toBe('A senha deve ter pelo menos 6 caracteres.');

    component.resetForm.controls.password.setValue('123456');
    component.resetForm.controls.passwordConfirmation.setValue('654321');
    component.onSubmit(event);
    expect(component.passwordConfirmationError()).toBe('As senhas precisam ser iguais.');
  });

  it('deve informar email ausente e limpar estados de interação', () => {
    component.resetForm.setValue({ password: '123456', passwordConfirmation: '123456' });
    component.onSubmit({ preventDefault: vi.fn() } as unknown as SubmitEvent);
    expect(component.resetError()).toContain('identificar o e-mail');

    component.togglePassword();
    component.togglePasswordConfirmation();
    expect(component.showPassword()).toBe(true);
    expect(component.showPasswordConfirmation()).toBe(true);
    component.clearErrors();
    expect(component.resetError()).toBe('');
  });
});
