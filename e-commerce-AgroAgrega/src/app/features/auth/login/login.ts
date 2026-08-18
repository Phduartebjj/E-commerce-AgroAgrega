import { Component } from '@angular/core';

@Component({
  selector: 'app-login',
  templateUrl: './login.html',
  styleUrls: ['./login.css'],
})
export class LoginComponent {
  email = '';
  password = '';
  remember = true;
  showPassword = false;

  onSubmit(): void {
    console.log({
      email: this.email,
      password: this.password,
      remember: this.remember,
    });
  }

  togglePassword(): void {
    this.showPassword = !this.showPassword;
  }
}
