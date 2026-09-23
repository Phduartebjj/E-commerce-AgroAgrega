declare const google: any;

import {
  Component,
  inject,
  signal,
  PLATFORM_ID,
  NgZone,
  AfterViewInit,
  ViewChild,
  ElementRef,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { jwtDecode } from 'jwt-decode';

import { Auth } from '@core/services/auth/auth.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.html',
  styleUrl: './login.css',
  imports: [RouterLink, ReactiveFormsModule],
})
export class Login implements AfterViewInit {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(Auth);
  private readonly router = inject(Router);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly ngZone = inject(NgZone);

  readonly showPassword = signal(false);

  readonly emailError = signal('');
  readonly passwordError = signal('');
  readonly loginError = signal('');

  readonly loginForm = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],

    password: ['', Validators.required],

    remember: [true],
  });

  get passwordValue(): string {
    return this.loginForm.controls.password.value;
  }

  ngAfterViewInit(): void {
    if (!isPlatformBrowser(this.platformId)) return;

    setTimeout(() => this.initGoogleLogin());
  }

  private initGoogleLogin(): void {
    const googleButton = document.getElementById('google-btn');

    if (!googleButton) {
      console.error('#google-btn não encontrado');
      return;
    }

    if (!google?.accounts?.id) {
      console.error('Google Identity Services não carregado');
      return;
    }

    google.accounts.id.initialize({
      client_id: '740887151146-vhcosdbujqt0iigquqecnj9b1b94pnl3.apps.googleusercontent.com',
      callback: (response: any) => {
        this.ngZone.run(() => {
          this.handleGoogleLogin(response);
        });
      },
    });

    googleButton.innerHTML = '';

    google.accounts.id.renderButton(googleButton, {
      theme: 'outline',
      size: 'large',
      text: 'signin_with',
      shape: 'rectangular',
      width: 1200,
      locale: 'pt-BR',
    });
  }

  private handleGoogleLogin(response: any): void {
    console.log('Resposta Google:', response);

    const credential = response?.credential;

    if (!credential) {
      console.error('Google não retornou o credential.');

      this.loginError.set('Não foi possível realizar o login com o Google.');

      return;
    }

    console.log('Google ID token:', credential);

    try {
      // Decodifica os dados do usuário contidos no token do Google
      const payload = jwtDecode<{
        sub: string;
        name: string;
        email: string;
      }>(credential);

      console.log('Dados do usuário autenticado no Google:', payload);

      // Registra a sessão no AuthService
      this.auth.loginWithGoogle({
        id: payload.sub,
        name: payload.name || payload.email.split('@')[0],
        email: payload.email,
      });

      // Redireciona para a página anterior ou Home
      this.router.navigateByUrl(this.lastUrl() || '/');
    } catch (err) {
      console.error('Erro ao decodificar token do Google:', err);
      this.loginError.set('Erro ao processar o login com o Google.');
    }
  }

  onSubmit(event: SubmitEvent): void {
    event.preventDefault();

    this.clearErrors();

    const email = this.sanitizeEmail(this.loginForm.controls.email.value);

    const password = this.sanitizePassword(this.loginForm.controls.password.value);

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

    const authenticated = this.auth.login(email, password);

    if (!authenticated) {
      this.loginError.set('E-mail ou senha inválidos.');

      return;
    }

    this.router.navigateByUrl(this.lastUrl() || '/');
  }

  togglePassword(): void {
    if (!this.passwordValue.length) {
      this.showPassword.set(false);
      return;
    }

    this.showPassword.update((value) => !value);
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
    const queryString = this.router.url.split('?')[1] ?? '';

    const params = new URLSearchParams(queryString);

    return params.get('returnUrl') ?? '';
  }

  private sanitizeEmail(value: string): string {
    return value.trim().toLowerCase().replace(/\s+/g, '');
  }

  private sanitizePassword(value: string): string {
    return value.trim();
  }

  private isValidEmail(value: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
  }
}
