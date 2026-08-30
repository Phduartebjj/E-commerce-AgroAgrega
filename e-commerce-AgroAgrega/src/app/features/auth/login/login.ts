import {
  Component,
  inject,
  signal,
} from '@angular/core';

import {
  FormBuilder,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';

import {
  Router,
  RouterLink,
} from '@angular/router';

import { Auth } from '@core/services/auth/auth.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.html',
  styleUrl: './login.css',
  imports: [
    RouterLink,
    ReactiveFormsModule,
  ],
})
export class Login {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(Auth);
  private readonly router = inject(Router);

  readonly showPassword = signal(false);

  readonly emailError = signal('');
  readonly passwordError = signal('');
  readonly loginError = signal('');

  readonly loginForm = this.fb.nonNullable.group({
    email: [
      '',
      [
        Validators.required,
        Validators.email,
      ],
    ],

    password: [
      '',
      Validators.required,
    ],

    remember: [
      true,
    ],
  });

  get passwordValue(): string {
    return this.loginForm.controls.password.value;
  }

  onSubmit(event: SubmitEvent): void {
    event.preventDefault();

    this.clearErrors();

    const email = this.sanitizeEmail(
      this.loginForm.controls.email.value,
    );

    const password = this.sanitizePassword(
      this.loginForm.controls.password.value,
    );

    this.loginForm.controls.email.setValue(email);
    this.loginForm.controls.password.setValue(password);

    if (!email) {
      this.emailError.set('Informe seu e-mail.');
      return;
    }

    if (!this.isValidEmail(email)) {
      this.emailError.set('Informe um e-mail válido.');
      return;
    }

    if (!password) {
      this.passwordError.set('Informe sua senha.');
      return;
    }

    const authenticated = this.auth.login(
      email,
      password,
    );

    if (!authenticated) {
      this.loginError.set(
        'E-mail ou senha inválidos.',
      );

      return;
    }

    this.router.navigateByUrl(
      this.lastUrl() || '/',
    );
  }

  togglePassword(): void {
    if (!this.passwordValue.length) {
      this.showPassword.set(false);
      return;
    }

    this.showPassword.update(
      value => !value,
    );
  }

  onPasswordInput(): void {
    this.passwordError.set('');
    this.loginError.set('');

    if (!this.passwordValue.length) {
      this.showPassword.set(false);
    }
  }

  clearErrors(): void {
    this.emailError.set('');
    this.passwordError.set('');
    this.loginError.set('');
  }

  private lastUrl(): string {
    const queryString =
      this.router.url.split('?')[1] ?? '';

    const params = new URLSearchParams(
      queryString,
    );

    return params.get('returnUrl') ?? '';
  }

  private sanitizeEmail(value: string): string {
    return value
      .trim()
      .toLowerCase()
      .replace(/\s+/g, '');
  }

  private sanitizePassword(value: string): string {
    return value.trim();
  }

  private isValidEmail(value: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
  }
}
