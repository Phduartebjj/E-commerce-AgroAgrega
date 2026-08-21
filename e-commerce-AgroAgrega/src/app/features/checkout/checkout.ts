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
    cep: new FormControl('', [Validators.required, validCep, Validators.maxLength(8)]),
    cellPhone: new FormControl('', [Validators.required, validPhone]),
    address: new FormControl('', [Validators.required, validAddressNumber]),
    number: new FormControl('', [Validators.required]),
    neighborhood: new FormControl('', [Validators.required]),
    city: new FormControl('', [Validators.required]),
    state: new FormControl('', [Validators.required]),
    complement: new FormControl(''),
  });
  states = [
    'AC',
    'AL',
    'AP',
    'AM',
    'BA',
    'CE',
    'DF',
    'ES',
    'GO',
    'MA',
    'MT',
    'MS',
    'MG',
    'PA',
    'PB',
    'PR',
    'PE',
    'PI',
    'RJ',
    'RN',
    'RS',
    'RO',
    'RR',
    'SC',
    'SP',
    'SE',
    'TO',
  ];

  getErrorMessage(control: AbstractControl): string {
    if (!control.errors) {
      return '';
    }

    const errorKey = Object.keys(control.errors)[0];

    return errorMessages[errorKey as keyof typeof errorMessages] ?? '';
  }
}

const errorMessages = {
  required: 'Campo obrigatório',
  minlength: 'Campo muito curto',
  numberInvalid: 'Não pode conter números',
  charsInvalid: 'Não pode conter caracteres especiais',
  invalidCep: 'CEP inválido',
  invalidPhone: 'Telefone inválido',
  invalidAddressNumber: 'Número do endereço inválido',
};

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
