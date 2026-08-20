import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-forgot-password',
  templateUrl: './forgot-password.html',
  styleUrls: ['./forgot-password.css'],
  imports: [FormsModule, RouterLink],
})
export class ForgotPassword {
  email = '';
  submitted = false;

  onSubmit(): void {
    console.log({ email: this.email });
    this.submitted = true;
  }
}
