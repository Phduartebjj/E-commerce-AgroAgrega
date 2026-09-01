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

  readonly PaymentMethod = OrderPaymentMethod;
  readonly router = inject(Router);

  readonly subTotal = this.cart.subtotal;
  readonly discountValue = this.cart.discountValue;

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

    const userId = this.auth.getId() || crypto.randomUUID();

    this.orderService.createOrder(
      this.cart.getCartItems()(),
      customerName,
      crypto.randomUUID(),
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
