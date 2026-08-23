import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { Auth } from '@core/services/auth/auth.service';

@Component({
  selector: 'app-register',
  imports: [FormsModule, RouterLink],
  templateUrl: './register.html',
  styleUrl: './register.css',
})
export class Register {
  private readonly auth = inject(Auth);
  private readonly router = inject(Router);

  name = '';
  email = '';
  password = '';
  passwordConfirmation = '';
  showPassword = false;
  showPasswordConfirmation = false;
  submitted = false;

  registerError = '';

  private lastUrl(): string{
    const route = this.router.url;
    if(route.includes("returnUrl=")) return route.substring(`returnUrl=`.length).split('=')[1].replaceAll("%2F", "/");
    return '';
  }

  get passwordsMatch(): boolean {
    return this.password === this.passwordConfirmation;
  }

  onSubmit(): void {
    if (!this.passwordsMatch) return;

    const name = this.sanitizeName(this.name);
    const email = this.sanitizeEmail(this.email);

    if (!name || !email || !this.password) return;

    const result = this.auth.register(name, email, this.password);
    if(!result.res) {
      this.registerError = result.message;
      return;
    };

    this.submitted = true;
    this.router.navigateByUrl(this.lastUrl());
  }

  private sanitizeName(value: string): string {
    return value
      .trim()
      .replace(/\s+/g, ' ')
      .replace(/[<>]/g, '');
  }

  private sanitizeEmail(value: string): string {
    return value
      .trim()
      .toLowerCase()
      .replace(/[<>]/g, '');
  }

  togglePassword(): void {
    this.showPassword = !this.showPassword;
  }

  togglePasswordConfirmation(): void {
    this.showPasswordConfirmation = !this.showPasswordConfirmation;
  }
}