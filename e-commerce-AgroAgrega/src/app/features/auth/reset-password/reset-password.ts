import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { Auth } from '@core/services/auth/auth.service';

@Component({
  selector: 'app-reset-password',
  imports: [FormsModule, RouterLink],
  templateUrl: './reset-password.html',
  styleUrl: './reset-password.css',
})
export class ResetPassword {
  email = '';
  password = '';
  passwordConfirmation = '';
  showPassword = false;
  showPasswordConfirmation = false;
  submitted = false;

  private auth = inject(Auth);
  private router = inject(Router);

  private getEmailUrl(): string{
    const route = this.router.url;
    if(route.includes("email=")) return route.substring(`email=`.length).split('=')[1];
  
    return '';
  }

  get passwordsMatch(): boolean {
    return this.password === this.passwordConfirmation;
  }

  onSubmit(): void {
    if (!this.passwordsMatch) {
      return;
    }

    this.password = this.sanitizePassword(this.password);
    this.email = this.getEmailUrl();  

    const reset = this.auth.resetPassword(this.email, this.password);
    
    if(!reset.res) return;
    
    this.submitted = true;
  }

  private sanitizePassword(password: string): string{
    return password.trim().replace(/\s+/g, '').replace(/[<>]/g, '');
  }

  togglePassword(): void {
    this.showPassword = !this.showPassword;
  }

  togglePasswordConfirmation(): void {
    this.showPasswordConfirmation = !this.showPasswordConfirmation;
  }
}
