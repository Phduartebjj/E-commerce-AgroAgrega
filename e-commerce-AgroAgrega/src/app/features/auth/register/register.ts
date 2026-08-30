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
  Router,
  RouterLink,
} from '@angular/router';

import { Auth } from '@core/services/auth/auth.service';

@Component({
  selector: 'app-register',
  imports: [
    ReactiveFormsModule,
    RouterLink,
  ],
  templateUrl: './register.html',
  styleUrl: './register.css',
})
export class Register {
  private readonly auth = inject(Auth);
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);

  readonly showPassword = signal(false);
  readonly showPasswordConfirmation = signal(false);
  readonly submitted = signal(false);

  readonly registerError = signal('');
  readonly nameError = signal('');
  readonly emailError = signal('');
  readonly passwordError = signal('');
  readonly passwordConfirmationError = signal('');

  readonly registerForm = this.fb.nonNullable.group({
    name: [
      '',
      [
        Validators.required,
        Validators.minLength(2),
      ],
    ],

    email: [
      '',
      [
        Validators.required,
        Validators.email,
      ],
    ],

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

    terms: [
      false,
      Validators.requiredTrue,
    ],
  });

  get passwordsMatch(): boolean {
    return (
      this.registerForm.controls.password.value ===
      this.registerForm.controls.passwordConfirmation.value
    );
  }

  onSubmit(event: SubmitEvent): void {
    event.preventDefault();

    this.clearErrors();

    if (this.registerForm.invalid) {
      this.validateForm();
      return;
    }

    if (!this.passwordsMatch) {
      this.passwordConfirmationError.set(
        'As senhas precisam ser iguais.',
      );

      return;
    }

    const name = this.sanitizeName(
      this.registerForm.controls.name.value,
    );

    const email = this.sanitizeEmail(
      this.registerForm.controls.email.value,
    );

    const password = this.sanitizePassword(
      this.registerForm.controls.password.value,
    );

    if (!name) {
      this.nameError.set(
        'Informe seu nome completo.',
      );

      return;
    }

    if (!email) {
      this.emailError.set(
        'Informe seu e-mail.',
      );

      return;
    }

    if (!this.isValidEmail(email)) {
      this.emailError.set(
        'Informe um e-mail válido.',
      );

      return;
    }

    if (!password) {
      this.passwordError.set(
        'Informe sua senha.',
      );

      return;
    }

    this.registerForm.controls.name.setValue(name);
    this.registerForm.controls.email.setValue(email);
    this.registerForm.controls.password.setValue(password);

    const result = this.auth.register(
      name,
      email,
      password,
    );

    if (!result.res) {
      this.registerError.set(
        result.message,
      );

      return;
    }

    this.submitted.set(true);

    this.router.navigateByUrl(
      this.lastUrl(),
    );
  }

  private validateForm(): void {
    const nameControl =
      this.registerForm.controls.name;

    const emailControl =
      this.registerForm.controls.email;

    const passwordControl =
      this.registerForm.controls.password;

    const passwordConfirmationControl =
      this.registerForm.controls.passwordConfirmation;

    const termsControl =
      this.registerForm.controls.terms;

    if (
      nameControl.invalid &&
      nameControl.hasError('required')
    ) {
      this.nameError.set(
        'Informe seu nome completo.',
      );
    } else if (
      nameControl.invalid &&
      nameControl.hasError('minlength')
    ) {
      this.nameError.set(
        'Informe um nome válido.',
      );
    }

    if (
      emailControl.invalid &&
      emailControl.hasError('required')
    ) {
      this.emailError.set(
        'Informe seu e-mail.',
      );
    } else if (
      emailControl.invalid &&
      emailControl.hasError('email')
    ) {
      this.emailError.set(
        'Informe um e-mail válido.',
      );
    }

    if (
      passwordControl.invalid &&
      passwordControl.hasError('required')
    ) {
      this.passwordError.set(
        'Informe sua senha.',
      );
    } else if (
      passwordControl.invalid &&
      passwordControl.hasError('minlength')
    ) {
      this.passwordError.set(
        'A senha deve ter pelo menos 6 caracteres.',
      );
    }

    if (
      passwordConfirmationControl.invalid &&
      passwordConfirmationControl.hasError('required')
    ) {
      this.passwordConfirmationError.set(
        'Confirme sua senha.',
      );
    }

    if (
      passwordConfirmationControl.valid &&
      !this.passwordsMatch
    ) {
      this.passwordConfirmationError.set(
        'As senhas precisam ser iguais.',
      );
    }

    if (
      termsControl.invalid &&
      termsControl.hasError('required')
    ) {
      this.registerError.set(
        'Você precisa aceitar os Termos de Uso.',
      );
    }
  }

  onNameInput(): void {
    this.nameError.set('');
    this.registerError.set('');
  }

  onEmailInput(): void {
    this.emailError.set('');
    this.registerError.set('');
  }

  onPasswordInput(): void {
    this.passwordError.set('');
    this.registerError.set('');
  }

  onPasswordConfirmationInput(): void {
    this.passwordConfirmationError.set('');
    this.registerError.set('');
  }

  onTermsChange(): void {
    this.registerError.set('');
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
    this.registerError.set('');
    this.nameError.set('');
    this.emailError.set('');
    this.passwordError.set('');
    this.passwordConfirmationError.set('');
  }

  private lastUrl(): string {
    const route = this.router.url;

    if (route.includes('returnUrl=')) {
      return route
        .substring(
          route.indexOf('returnUrl=') +
          'returnUrl='.length,
        )
        .split('=')[0]
        .replaceAll('%2F', '/');
    }

    return '/login';
  }

  private sanitizeName(
    value: string,
  ): string {
    return value
      .trim()
      .replace(/\s+/g, ' ')
      .replace(/[<>]/g, '');
  }

  private sanitizeEmail(
    value: string,
  ): string {
    return value
      .trim()
      .toLowerCase()
      .replace(/\s+/g, '')
      .replace(/[<>]/g, '');
  }

  private sanitizePassword(
    value: string,
  ): string {
    return value
      .trim()
      .replace(/\s+/g, '')
      .replace(/[<>]/g, '');
  }

  private isValidEmail(
    value: string,
  ): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
      value,
    );
  }
}
