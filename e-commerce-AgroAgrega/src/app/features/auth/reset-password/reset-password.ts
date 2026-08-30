import {
  Component,
  inject,
  signal,
} from '@angular/core';

import {
  FormBuilder,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';

import {
  ActivatedRoute,
  Router,
  RouterLink,
} from '@angular/router';

import { Auth } from '@core/services/auth/auth.service';

@Component({
  selector: 'app-reset-password',
  imports: [
    ReactiveFormsModule,
    RouterLink,
  ],
  templateUrl: './reset-password.html',
  styleUrl: './reset-password.css',
})
export class ResetPassword {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(Auth);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  readonly showPassword = signal(false);
  readonly showPasswordConfirmation = signal(false);
  readonly submitted = signal(false);

  readonly passwordError = signal('');
  readonly passwordConfirmationError = signal('');
  readonly resetError = signal('');

  readonly resetForm = this.fb.nonNullable.group({
    password: [
      '',
      [
        Validators.required,
        Validators.minLength(6),
      ],
    ],

    passwordConfirmation: [
      '',
      [
        Validators.required,
      ],
    ],
  });

  get password(): string {
    return this.resetForm.controls.password.value;
  }

  get passwordConfirmation(): string {
    return this.resetForm.controls.passwordConfirmation.value;
  }

  get passwordsMatch(): boolean {
    return (
      this.password ===
      this.passwordConfirmation
    );
  }

  onSubmit(event: SubmitEvent): void {
    event.preventDefault();

    this.clearErrors();

    const password =
      this.sanitizePassword(
        this.password,
      );

    const passwordConfirmation =
      this.sanitizePassword(
        this.passwordConfirmation,
      );

    this.resetForm.controls.password.setValue(
      password,
    );

    this.resetForm.controls.passwordConfirmation.setValue(
      passwordConfirmation,
    );

    if (!password) {
      this.passwordError.set(
        'Informe uma nova senha.',
      );

      return;
    }

    if (password.length < 6) {
      this.passwordError.set(
        'A senha deve ter pelo menos 6 caracteres.',
      );

      return;
    }

    if (!passwordConfirmation) {
      this.passwordConfirmationError.set(
        'Confirme sua senha.',
      );

      return;
    }

    if (!this.passwordsMatch) {
      this.passwordConfirmationError.set(
        'As senhas precisam ser iguais.',
      );

      return;
    }

    const email =
      this.getEmail();

    if (!email) {
      this.resetError.set(
        'Não foi possível identificar o e-mail para redefinir a senha.',
      );

      return;
    }

    const reset =
      this.auth.resetPassword(
        email,
        password,
      );

    if (!reset.res) {
      this.resetError.set(
        'Não foi possível alterar sua senha.',
      );

      return;
    }

    this.submitted.set(true);
  }

  onPasswordInput(): void {
    this.passwordError.set('');
    this.resetError.set('');
  }

  onPasswordConfirmationInput(): void {
    this.passwordConfirmationError.set('');
    this.resetError.set('');
  }

  togglePassword(): void {
    this.showPassword.update(
      value => !value,
    );
  }

  togglePasswordConfirmation(): void {
    this.showPasswordConfirmation.update(
      value => !value,
    );
  }

  clearErrors(): void {
    this.passwordError.set('');
    this.passwordConfirmationError.set('');
    this.resetError.set('');
  }

  private getEmail(): string {
    return (
      this.route.snapshot.queryParamMap
        .get('email')
        ?.trim()
        .toLowerCase() ?? ''
    );
  }

  private sanitizePassword(
    password: string,
  ): string {
    return password
      .trim()
      .replace(/\s+/g, '')
      .replace(/[<>]/g, '');
  }
}
