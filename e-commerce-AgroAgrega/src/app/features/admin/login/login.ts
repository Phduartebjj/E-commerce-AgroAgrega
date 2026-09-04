import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthAdminService } from '@core/services/auth/auth-admin.service';

@Component({
  selector: 'app-admin-login',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class AdminLoginComponent {
  usuario = '';
  senha = '';
  erro = false;
  
  private auth = inject(AuthAdminService);
  private router = inject(Router);
//   constructor(
//     private auth: AuthAdminService,
//     private router: Router,
//   ) {}

  onSubmit(): void {
    const sucesso = this.auth.LoginAdmin(this.usuario, this.senha);

    console.log(sucesso);
    
    if (sucesso) {
      this.erro = false;
      this.router.navigateByUrl('/admin');
    } else {
      this.erro = true;
    }
  }
}
