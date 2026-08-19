import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Cart } from '../../core/services/cart/cart.service';
import { inject } from '@angular/core';
import { PrecoFormatadoPipe } from '../../shared/pipes/preco-formatado-pipe';
import {
  ReactiveFormsModule,
  FormGroup,
  FormControl,
  Validators,
  AbstractControl,
  ValidationErrors,
} from '@angular/forms';

@Component({
  selector: 'app-checkout',
  imports: [RouterLink, PrecoFormatadoPipe, ReactiveFormsModule],
  templateUrl: './checkout.html',
  styleUrl: './checkout.css',
})
export class CheckoutComponent {
  private cart = inject(Cart);

  totalValue = this.cart.total;
  subTotal = this.cart.subtotal;
  discountValue = this.cart.discountValue;

  checkoutForm = new FormGroup({
    fullName: new FormControl('', [
      Validators.required,
      Validators.minLength(3),
      nameNoSpecialChars,
    ]),
  });

  getErrorMessage(controlName: string): string {
    const control = this.checkoutForm.get(controlName);

    if (!control?.touched || !control.errors) {
      return '';
    }

    if (control.errors['required']) {
      return 'Campo obrigatório';
    }

    if (control.errors['minlength']) {
      return 'Campo muito curto';
    }

    if (control.errors['numberInvalid']) {
      return 'Não pode conter números ';
    }

    if (control.errors['charsInvalid']) {
      return 'Não pode conter caracteres especiais';
    }

    return '';
  }
}

function nameNoSpecialChars(control: AbstractControl): ValidationErrors | null {
  const value = control.value;

  if (!value) return null;

  if (!/^[A-Za-zÀ-ÖØ-öø-ÿ\s]+$/.test(value)) {
    return { charsInvalid: true };
  }

  return null;
}

function validCep(control: AbstractControl): ValidationErrors | null {
  const value = control.value;

  if (!value) return null;

  if (!/^\d{5}-?\d{3}$/.test(value)) {
    return { invalidCep: true };
  }

  return null;
}

function validPhone(control: AbstractControl): ValidationErrors | null {
  const value = control.value;
  if (!value) return null;

  if (!/^\(?\d{2}\)?\s?9?\d{4}-?\d{4}$/.test(value)) {
    return { invalidPhone: true };
  }

  return null;
}

function validAddressNumber(control: AbstractControl): ValidationErrors | null {
  const value = control.value;

  if (!value) return null;

  if (!/^\d+$/.test(value)) {
    return { invalidAddressNumber: true };
  }

  return null;
}
