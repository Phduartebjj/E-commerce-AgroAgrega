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

@Component({
  selector: 'app-forgot-password',
  templateUrl: './forgot-password.html',
  styleUrl: './forgot-password.css',
  imports: [
    ReactiveFormsModule,
    RouterLink,
  ],
})
export class ForgotPassword {
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);

  readonly submitted = signal(false);
  readonly emailError = signal('');

  readonly forgotPasswordForm =
    this.fb.nonNullable.group({
      email: [
        '',
        [
          Validators.required,
          Validators.email,
        ],
      ],
    });

  get email(): string {
    return this.forgotPasswordForm.controls.email.value;
  }

  onSubmit(event: SubmitEvent): void {
    event.preventDefault();

    this.emailError.set('');

    const email = this.sanitizeEmail(
      this.email,
    );

    this.forgotPasswordForm.controls.email.setValue(
      email,
    );

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

    this.submitted.set(true);

    this.router.navigate(
      ['/reset-password'],
      {
        queryParams: {
          email,
        },
      },
    );
  }

  onEmailInput(): void {
    this.emailError.set('');
  }

  private sanitizeEmail(
    value: string,
  ): string {
    return value
      .trim()
      .toLowerCase()
      .replace(/\s+/g, '');
  }

  private isValidEmail(
    value: string,
  ): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
      value,
    );
  }
}
