import { Component, inject } from '@angular/core';
import { Auth } from '@core/services/auth/auth.service';
import { UserModel } from '@models/user';

@Component({
  selector: 'app-register',
  imports: [],
  templateUrl: './register.html',
  styleUrl: './register.css',
})
export class Register {
  private auth = inject(Auth);
  
  registrar = (): void => {
      this.auth.register("admin", "admin@gmail.com", "senha123");
  }
}
