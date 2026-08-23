import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { Auth } from '@core/services/auth/auth.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.html',
  styleUrls: ['./login.css'],
  imports: [RouterLink, FormsModule],
})
export class Login {
  private readonly auth = inject(Auth);
  private readonly router = inject(Router);

  email = '';
  password = '';
  remember = true;
  showPassword = false;

  emailError = '';
  passwordError = '';
  loginError = '';

  private lastUrl(): string{
    const route = this.router.url;
    if(route.includes("returnUrl=")) return route.substring(`returnUrl=`.length).split('=')[1].replaceAll("%2F", "/");
    return '';
  }

  onSubmit(): void {
    this.clearErrors();

    const email = this.sanitizeEmail(this.email);
    const password = this.sanitizePassword(this.password);

    this.email = email;
    this.password = password;

    if(!email){
      this.emailError = 'Informe seu e-mail.';
      return;
    }

    if(!this.isValidEmail(email)){
      this.emailError = 'Informe um e-mail válido.';
      return;
    }

    if(!password){
      this.passwordError = 'Informe sua senha.';
      return;
    }

    const authenticated = this.auth.login(email, password);
    if(authenticated){
      this.router.navigateByUrl(this.lastUrl());
    };
    this.loginError = 'Email/senha inválido';

  }

  togglePassword(): void {
    if(!this.password.length){
      this.showPassword = false;
      return;
    }

    this.showPassword = !this.showPassword;
  }

  onPasswordInput(): void{
    this.passwordError = '';
    this.loginError = '';

    if (!this.password.length){
      this.showPassword = false;
    }
  }

  clearErrors(): void{
    this.emailError = '';
    this.passwordError = '';
    this.loginError = '';
  }

  private sanitizeEmail(value: string): string{
    return value.trim().toLowerCase().replace(/\s+/g, '');
  }

  private sanitizePassword(value: string): string{
    return value.trim();
  }

  private isValidEmail(value: string): boolean{
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
  }
}