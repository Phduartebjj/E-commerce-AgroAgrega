import { Component, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';

import { Cart } from '../../core/services/cart/cart.service';
import { PrecoFormatadoPipe } from '../../shared/pipes/preco-formatado-pipe';

import {
  ReactiveFormsModule,
  FormGroup,
  FormControl,
  Validators,
  AbstractControl,
  ValidationErrors,
} from '@angular/forms';

import { OrderService } from '@core/services/order/order.service';
import { CepService } from '@core/services/cep/cep';
import { OrderPaymentMethod } from '@models/order';
import { AddressModel } from '@models/address.model';
import { Auth } from '@core/services/auth/auth.service';
import { errorMessages } from '@shared/constants/form-error-messages';
import { AddressService } from '@core/services/address/address.service';

@Component({
  selector: 'app-checkout',
  imports: [RouterLink, PrecoFormatadoPipe, ReactiveFormsModule],
  templateUrl: './checkout.html',
  styleUrl: './checkout.css',
})
export class CheckoutComponent {
  private cart = inject(Cart);
  private readonly cepService = inject(CepService);
  private orderService = inject(OrderService);
  private auth = inject(Auth);
  private readonly addressService = inject(AddressService);
  readonly PaymentMethod = OrderPaymentMethod;
  readonly router = inject(Router);

  readonly subTotal = this.cart.subtotal;
  readonly discountValue = this.cart.discountValue;

  savedAddresses: AddressModel[] = [];
  selectedAddressId: string | null = null;
  private loadSavedAddresses(): void {
    const userId = this.auth.getId();

    if (!userId) {
      this.savedAddresses = [];
      return;
    }

    this.savedAddresses = this.addressService.getAddresses(userId);
  }

  constructor() {
    this.loadSavedAddresses();
  }

  selectSavedAddress(addressId: string): void {
    const address = this.savedAddresses.find((address) => address.id === addressId);

    if (!address) {
      return;
    }

    this.selectedAddressId = address.id;

    this.checkoutForm.patchValue({
      fullName: address.fullName,
      cep: address.cep,
      address: address.address,
      number: address.number,
      neighborhood: address.neighborhood,
      city: address.city,
      state: address.state,
      complement: address.complement ?? '',
    });
  }

  checkoutForm = new FormGroup({
    fullName: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.minLength(3), nameNoSpecialChars],
    }),

    cep: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, validCep],
    }),

    cellPhone: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, validPhone],
    }),

    address: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required],
    }),

    number: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required],
    }),

    neighborhood: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, nameNoNumbers],
    }),

    city: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, nameNoNumbers],
    }),

    state: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required],
    }),

    complement: new FormControl('', {
      nonNullable: true,
    }),

    deliveryMethod: new FormControl('standard', {
      nonNullable: true,
      validators: [Validators.required],
    }),

    paymentMethod: new FormControl<OrderPaymentMethod | null>(null, {
      validators: [Validators.required],
    }),

    cardName: new FormControl('', {
      nonNullable: true,
      validators: [Validators.minLength(3), nameNoSpecialChars],
    }),

    cardNumber: new FormControl('', {
      nonNullable: true,
      validators: [validCardNumber],
    }),

    cardHolder: new FormControl('', {
      nonNullable: true,
      validators: [nameNoSpecialChars],
    }),

    cardExpiration: new FormControl('', {
      nonNullable: true,
      validators: [validCardExpiration],
    }),

    cardCvv: new FormControl('', {
      nonNullable: true,
      validators: [validCardCvv],
    }),

    cardCpf: new FormControl('', {
      nonNullable: true,
      validators: [validCpf],
    }),

    installments: new FormControl<number | null>(null),
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

  getCep(): void {
    const cep = this.checkoutForm.controls.cep.value;

    const cepLimpo = cep.replace(/\D/g, '');

    if (cepLimpo.length !== 8) {
      return;
    }

    this.cepService.getCep(cepLimpo).subscribe({
      next: (dados) => {
        if (dados.erro) {
          this.checkoutForm.controls.cep.setErrors({
            invalidCep: true,
          });
          return;
        }

        this.checkoutForm.patchValue({
          address: dados.logradouro,
          complement: dados.complemento,
          neighborhood: dados.bairro,
          city: dados.localidade,
          state: dados.uf,
        });
      },

      error: (erro) => {
        console.error('Erro ao buscar CEP:', erro);
      },
    });
  }

  get paymentDiscountValue(): number {
    return this.checkoutForm.controls.paymentMethod.value === OrderPaymentMethod.Pix
      ? this.cart.subtotal() * 0.1
      : 0;
  }

  get discountTotalValue(): number {
    return this.cart.discountValue() + this.paymentDiscountValue;
  }

  get totalValue(): number {
    return this.cart.total() - this.paymentDiscountValue;
  }

  selectPaymentMethod(paymentMethod: OrderPaymentMethod): void {
    this.checkoutForm.controls.paymentMethod.setValue(paymentMethod);
    this.checkoutForm.controls.paymentMethod.markAsTouched();

    const cardFields = [
      this.checkoutForm.controls.cardNumber,
      this.checkoutForm.controls.cardHolder,
      this.checkoutForm.controls.cardExpiration,
      this.checkoutForm.controls.cardCvv,
      this.checkoutForm.controls.cardCpf,
      this.checkoutForm.controls.cardName,
    ];

    const installments = this.checkoutForm.controls.installments;

    const isCreditCard = paymentMethod === OrderPaymentMethod.CreditCard;

    const isCard =
      paymentMethod === OrderPaymentMethod.CreditCard ||
      paymentMethod === OrderPaymentMethod.DebitCard;

    if (isCard) {
      cardFields.forEach((control) => {
        control.addValidators(Validators.required);
        control.updateValueAndValidity();
      });
    } else {
      cardFields.forEach((control) => {
        control.removeValidators(Validators.required);
        control.updateValueAndValidity();
      });
    }

    if (isCreditCard) {
      installments.addValidators(Validators.required);
    } else {
      installments.removeValidators(Validators.required);
      installments.setValue(null);
    }

    installments.updateValueAndValidity();
  }

  getErrorMessage(control: AbstractControl): string {
    if (!control.errors) {
      return '';
    }

    const errorKey = Object.keys(control.errors)[0];

    return errorMessages[errorKey as keyof typeof errorMessages] ?? '';
  }

  finishOrder(): void {
    if (this.checkoutForm.invalid) {
      this.checkoutForm.markAllAsTouched();
      return;
    }

    const paymentMethod = this.checkoutForm.controls.paymentMethod.value;

    if (!paymentMethod) {
      this.checkoutForm.controls.paymentMethod.markAsTouched();
      return;
    }

    const address: AddressModel = {
      id: crypto.randomUUID(),
      fullName: this.checkoutForm.controls.fullName.value,
      cep: this.checkoutForm.controls.cep.value,
      address: this.checkoutForm.controls.address.value,
      number: this.checkoutForm.controls.number.value,
      neighborhood: this.checkoutForm.controls.neighborhood.value,
      city: this.checkoutForm.controls.city.value,
      state: this.checkoutForm.controls.state.value,
      complement: this.checkoutForm.controls.complement.value,
    };

    const customerName =
      this.checkoutForm.get('fullName')?.value?.trim() || this.auth.getName() || 'Cliente';

    this.orderService.createOrder(
      this.cart.getCartItems()(),
      customerName,
      this.cart.subtotal(),
      this.discountTotalValue,
      0,
      paymentMethod,
      address,
    );

    this.cart.removeCoupon();
    this.cart.cleanCartItem();

    this.router.navigate(['/orders']);
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

function nameNoNumbers(control: AbstractControl): ValidationErrors | null {
  const value = control.value;

  if (!value) return null;

  if (/\d/.test(value)) {
    return { numberInvalid: true };
  }

  return null;
}

function validCardNumber(control: AbstractControl): ValidationErrors | null {
  const value = control.value?.replace(/\D/g, '');

  if (!value) {
    return null;
  }

  if (value.length < 13 || value.length > 19) {
    return { invalidCardNumber: true };
  }

  let sum = 0;
  let shouldDouble = false;

  for (let i = value.length - 1; i >= 0; i--) {
    let digit = Number(value[i]);

    if (shouldDouble) {
      digit *= 2;

      if (digit > 9) {
        digit -= 9;
      }
    }

    sum += digit;
    shouldDouble = !shouldDouble;
  }

  return sum % 10 === 0 ? null : { invalidCardNumber: true };
}

function validCardExpiration(control: AbstractControl): ValidationErrors | null {
  const value = control.value;

  if (!value) {
    return null;
  }

  if (!/^(0[1-9]|1[0-2])\/\d{2}$/.test(value)) {
    return { invalidCardExpiration: true };
  }

  const [month, year] = value.split('/').map(Number);

  const currentDate = new Date();

  const currentMonth = currentDate.getMonth() + 1;
  const currentYear = currentDate.getFullYear() % 100;

  if (year < currentYear || (year === currentYear && month < currentMonth)) {
    return { expiredCard: true };
  }

  return null;
}

function validCardCvv(control: AbstractControl): ValidationErrors | null {
  const value = control.value;

  if (!value) {
    return null;
  }

  if (!/^\d{3,4}$/.test(value)) {
    return { invalidCardCvv: true };
  }

  return null;
}

function validCpf(control: AbstractControl): ValidationErrors | null {
  const value = control.value?.replace(/\D/g, '');

  if (!value) {
    return null;
  }

  if (value.length !== 11) {
    return { invalidCpf: true };
  }

  if (/^(\d)\1{10}$/.test(value)) {
    return { invalidCpf: true };
  }

  let sum = 0;

  for (let i = 0; i < 9; i++) {
    sum += Number(value[i]) * (10 - i);
  }

  let digit = (sum * 10) % 11;

  if (digit === 10) {
    digit = 0;
  }

  if (digit !== Number(value[9])) {
    return { invalidCpf: true };
  }

  sum = 0;

  for (let i = 0; i < 10; i++) {
    sum += Number(value[i]) * (11 - i);
  }

  digit = (sum * 10) % 11;

  if (digit === 10) {
    digit = 0;
  }

  if (digit !== Number(value[10])) {
    return { invalidCpf: true };
  }

  return null;
}

function validInstallments(control: AbstractControl): ValidationErrors | null {
  const value = control.value;

  if (value === null || value === '') {
    return null;
  }

  if (!Number.isInteger(value) || value < 1 || value > 12) {
    return { invalidInstallments: true };
  }

  return null;
}
