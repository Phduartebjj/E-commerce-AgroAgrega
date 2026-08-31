import { Component } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
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
import { OrderService } from '@core/services/order/order.service';
import { Auth } from '@core/services/auth/auth.service';

@Component({
  selector: 'app-checkout',
  imports: [RouterLink, PrecoFormatadoPipe, ReactiveFormsModule],
  templateUrl: './checkout.html',
  styleUrl: './checkout.css',
})
export class CheckoutComponent {
  private cart = inject(Cart);
  private orderService = inject(OrderService);
  private auth = inject(Auth);
  router = inject(Router);

  subTotal = this.cart.subtotal;
  discountValue = this.cart.discountValue;

  get paymentDiscountValue(): number {
    return this.checkoutForm.get('paymentMethod')?.value === 'pix'
      ? this.cart.subtotal() * 0.1
      : 0;
  }

  get discountTotalValue(): number {
    return this.cart.discountValue() + this.paymentDiscountValue;
  }

  get totalValue(): number {
    return this.cart.total() - this.paymentDiscountValue;
  }

  checkoutForm = new FormGroup({
    fullName: new FormControl('', [
      Validators.required,
      Validators.minLength(3),
      nameNoSpecialChars,
    ]),
    cep: new FormControl('', [Validators.required, validCep]),
    cellPhone: new FormControl('', [Validators.required, validPhone]),
    address: new FormControl('', [Validators.required]),
    number: new FormControl('', [Validators.required]),
    neighborhood: new FormControl('', [Validators.required, nameNoNumbers]),
    city: new FormControl('', [Validators.required, nameNoNumbers]),
    state: new FormControl('', [Validators.required]),
    complement: new FormControl(''),
    deliveryMethod: new FormControl('standard', [Validators.required]),
    paymentMethod: new FormControl('pix', [Validators.required]),
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

  finishOrder() {
    if (this.checkoutForm.invalid) {
      this.checkoutForm.markAllAsTouched();
      return;
    }

    const customerName =
      this.checkoutForm.get('fullName')?.value?.trim() ||
      this.auth.getName() ||
      'Cliente';

    this.orderService.createOrder(
      this.cart.getCartItems()(),
      customerName,
      crypto.randomUUID(),
      this.cart.subtotal(),
      this.discountTotalValue,
      0,
    );
    this.cart.removeCoupon();
    this.cart.cleanCartItem();
    this.router.navigate(['/orders']);
  }
}

const errorMessages = {
  required: 'Campo obrigatório',
  minlength: 'Campo muito curto',
  numberInvalid: 'Não pode conter números',
  charsInvalid: 'Não pode conter caracteres especiais',
  invalidCep: 'CEP inválido',
  invalidPhone: 'Telefone inválido',
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

function nameNoNumbers(control: AbstractControl): ValidationErrors | null {
  const value = control.value;

  if (!value) return null;

  if (/\d/.test(value)) {
    return { numberInvalid: true };
  }
  return null;
}
