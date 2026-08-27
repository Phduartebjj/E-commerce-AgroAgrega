import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { Auth } from '@core/services/auth/auth.service';

@Component({
  selector: 'app-minha-conta',
  imports: [ReactiveFormsModule],
  templateUrl: './minha-conta.html',
  styleUrl: './minha-conta.css',
})
export class MinhaConta {
  private readonly auth = inject(Auth);
  private readonly formBuilder = inject(FormBuilder);
  private readonly router = inject(Router);

  userName = this.auth.getName();
  userEmail = this.auth.getEmail();

  readonly profileForm = this.formBuilder.nonNullable.group({
    name: [this.userName, [Validators.required, Validators.minLength(2)]],
    email: [this.userEmail, [Validators.required, Validators.email]],
  });

  editingProfile = false;

  editProfile(): void {
    this.editingProfile = true;
  }

  saveProfile(): void {
    if (this.profileForm.invalid) return;

    const name = this.profileForm.controls.name.value.trim();
    const email = this.profileForm.controls.email.value.trim().toLowerCase();
    if (!name) return;

    const result = this.auth.updateProfile(name, email);
    if (!result.res) return;

    this.userName = name;
    this.userEmail = email;
    this.editingProfile = false;
  }
  logout(): void {
    this.auth.logout();
    this.router.navigateByUrl('/');
  }

  removeAccount(): void {
    const confirmed = confirm('Tem certeza que deseja remover sua conta?');

    if (!confirmed) {
      return;
    }

    this.auth.removeAccount();
    this.router.navigateByUrl('/');
  }

  cancelEdit(): void {
    this.editingProfile = false;
    this.profileForm.reset({
      name: this.userName,
      email: this.userEmail,
    });
  }
}
