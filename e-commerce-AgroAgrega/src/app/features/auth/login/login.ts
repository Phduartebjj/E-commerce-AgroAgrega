import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-login',
  templateUrl: './login.html',
  styleUrls: ['./login.css'],
  imports: [RouterLink],
})
export class Login {
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
