import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

@Component({
  selector: 'app-forgot-password',
  templateUrl: './forgot-password.html',
  styleUrls: ['./forgot-password.css'],
  imports: [FormsModule, RouterLink],
})
export class ForgotPassword {
  email = '';
  submitted = false;

  private router = inject(Router);

  onSubmit(): void {
    if(!this.email) return;
    
    this.submitted = true;
    this.router.navigate(['/reset-password'], {
      queryParams: {
        email: this.email,
      },
    });
  }
}
