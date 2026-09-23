import { isPlatformBrowser } from '@angular/common';
import { Component, ElementRef, inject, PLATFORM_ID, ViewChild } from '@angular/core';
import { Router, RouterLink } from '@angular/router';

const bwipjs = {
  toCanvas(
    canvas: HTMLCanvasElement,
    options: {
      bcid: string;
      text: string;
      scale?: number;
      padding?: number;
      backgroundcolor?: string;
      barcolor?: string;
      height?: number;
    },
  ): void {
    const scale = options.scale ?? 2;
    const padding = options.padding ?? 0;
    const context = canvas.getContext('2d');

    if (!context) {
      throw new Error('Canvas is not supported');
    }

    const isQrCode = options.bcid === 'qrcode';
    const size = isQrCode ? 29 : options.text.length * 11;

    canvas.width = size * scale + padding * 2;
    canvas.height =
      (isQrCode ? size : (options.height ?? 16)) * scale + padding * 2;

    context.fillStyle = `#${options.backgroundcolor ?? 'FFFFFF'}`;
    context.fillRect(0, 0, canvas.width, canvas.height);

    context.fillStyle = `#${options.barcolor ?? '000000'}`;

    if (isQrCode) {
      for (let y = 0; y < size; y++) {
        for (let x = 0; x < size; x++) {
          const index = (x + y * size) % options.text.length;

          if ((options.text.charCodeAt(index) + x * 3 + y * 7) % 5 < 2) {
            context.fillRect(
              padding + x * scale,
              padding + y * scale,
              scale,
              scale,
            );
          }
        }
      }
    } else {
      for (let index = 0; index < options.text.length * 8; index++) {
        if (
          (options.text.charCodeAt(index % options.text.length) + index) % 3 !==
          0
        ) {
          context.fillRect(
            padding + index * scale,
            padding,
            scale,
            (options.height ?? 16) * scale,
          );
        }
      }
    }
  },
};

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
import { PaymentApiService } from '@core/services/payment-api.service';
import { CepService } from '@core/services/cep/cep';
import { OrderPaymentMethod, OrderStatus } from '@models/order';
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
  private readonly paymentApiService = inject(PaymentApiService);
  private auth = inject(Auth);
  private readonly addressService = inject(AddressService);
  private readonly platformId = inject(PLATFORM_ID);

  readonly PaymentMethod = OrderPaymentMethod;
  readonly router = inject(Router);

  readonly checkoutItems = this.cart.selectedCartItems;
  readonly subTotal = this.cart.selectedSubtotal;
  readonly discountValue = this.cart.selectedCouponDiscount;
  readonly deliveryEstimate = getDeliveryEstimate();
  readonly boletoDueDate = formatLongDate(addBusinessDays(new Date(), 3));

  pixCopyPasteCode = '';
  pixExpiresAt = '';
  boletoBarcodeValue = '';
  boletoDigitableLine = '';
  paymentCodeFeedback = '';

  private pixCanvas?: HTMLCanvasElement;
  private boletoCanvas?: HTMLCanvasElement;

  @ViewChild('pixCanvas')
  set pixCanvasRef(element: ElementRef<HTMLCanvasElement> | undefined) {
    this.pixCanvas = element?.nativeElement;
    this.renderPixQrCode();
  }

  @ViewChild('boletoCanvas')
  set boletoCanvasRef(element: ElementRef<HTMLCanvasElement> | undefined) {
    this.boletoCanvas = element?.nativeElement;
    this.renderBoletoBarcode();
  }

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
    const address = this.savedAddresses.find(
      (address) => address.id === addressId,
    );

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
      validators: [
        Validators.required,
        Validators.minLength(3),
        nameNoSpecialChars,
      ],
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
    return this.checkoutForm.controls.paymentMethod.value ===
      OrderPaymentMethod.Pix
      ? this.cart.selectedPixDiscount()
      : 0;
  }

  get discountTotalValue(): number {
    return this.cart.selectedCouponDiscount() + this.paymentDiscountValue;
  }

  get totalValue(): number {
    return this.cart.selectedTotal() - this.paymentDiscountValue;
  }

  selectPaymentMethod(paymentMethod: OrderPaymentMethod): void {
    this.checkoutForm.controls.paymentMethod.setValue(paymentMethod);
    this.checkoutForm.controls.paymentMethod.markAsTouched();

    const cardFields = [
      this.checkoutForm.controls.cardNumber,
      this.checkoutForm.controls.cardExpiration,
      this.checkoutForm.controls.cardCvv,
      this.checkoutForm.controls.cardCpf,
      this.checkoutForm.controls.cardName,
    ];

    const installments = this.checkoutForm.controls.installments;

    const isCreditCard =
      paymentMethod === OrderPaymentMethod.CreditCard;

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

    if (paymentMethod === OrderPaymentMethod.Pix) {
      this.generatePixCode();
    } else if (paymentMethod === OrderPaymentMethod.Boleto) {
      this.generateBoletoCode();
    }
  }

  regeneratePaymentCode(): void {
    const paymentMethod =
      this.checkoutForm.controls.paymentMethod.value;

    if (paymentMethod === OrderPaymentMethod.Pix) {
      this.generatePixCode();
    } else if (paymentMethod === OrderPaymentMethod.Boleto) {
      this.generateBoletoCode();
    }
  }

  async copyPaymentCode(
    value: string,
    label: string,
  ): Promise<void> {
    if (!isPlatformBrowser(this.platformId) || !navigator.clipboard) {
      this.paymentCodeFeedback =
        'Selecione e copie o código manualmente.';
      return;
    }

    try {
      await navigator.clipboard.writeText(value);
      this.paymentCodeFeedback = `${label} copiado.`;
    } catch {
      this.paymentCodeFeedback =
        'Não foi possível copiar. Selecione o código manualmente.';
    }
  }

  private generatePixCode(): void {
    const now = new Date();
    const expiresAt = new Date(
      now.getTime() + 30 * 60 * 1000,
    );

    const reference = `AGPIX${now
      .getTime()
      .toString(36)
      .toUpperCase()}${randomDigits(4)}`;

    this.pixExpiresAt = new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    }).format(expiresAt);

    this.pixCopyPasteCode = [
      'AGROAGREGA',
      'PIX-DEMONSTRACAO',
      `REF=${reference}`,
      `VALOR=${this.totalValue.toFixed(2)}`,
      `EXPIRA=${expiresAt.toISOString()}`,
    ].join('|');

    this.paymentCodeFeedback = '';
    this.renderPixQrCode();
  }

  private generateBoletoCode(): void {
    const digits = randomDigits(47);

    this.boletoBarcodeValue = digits.slice(0, 44);
    this.boletoDigitableLine = formatDigitableLine(digits);
    this.paymentCodeFeedback = '';
    this.renderBoletoBarcode();
  }

  private renderPixQrCode(): void {
    if (
      !isPlatformBrowser(this.platformId) ||
      !this.pixCanvas ||
      !this.pixCopyPasteCode
    ) {
      return;
    }

    try {
      bwipjs.toCanvas(this.pixCanvas, {
        bcid: 'qrcode',
        text: this.pixCopyPasteCode,
        scale: 4,
        padding: 10,
        backgroundcolor: 'FFFFFF',
        barcolor: '123C2C',
      });
    } catch {
      this.paymentCodeFeedback =
        'Não foi possível desenhar o QR Code neste navegador.';
    }
  }

  private renderBoletoBarcode(): void {
    if (
      !isPlatformBrowser(this.platformId) ||
      !this.boletoCanvas ||
      !this.boletoBarcodeValue
    ) {
      return;
    }

    try {
      bwipjs.toCanvas(this.boletoCanvas, {
        bcid: 'code128',
        text: this.boletoBarcodeValue,
        scale: 2,
        height: 16,
        padding: 8,
        backgroundcolor: 'FFFFFF',
        barcolor: '10271F',
      });
    } catch {
      this.paymentCodeFeedback =
        'Não foi possível desenhar o código de barras neste navegador.';
    }
  }

  getErrorMessage(control: AbstractControl): string {
    if (!control.errors) {
      return '';
    }

    const errorKey = Object.keys(control.errors)[0];

    return (
      errorMessages[errorKey as keyof typeof errorMessages] ?? ''
    );
  }

  finishOrder(): void {
    if (this.checkoutForm.invalid) {
      this.checkoutForm.markAllAsTouched();
      return;
    }

    const paymentMethod =
      this.checkoutForm.controls.paymentMethod.value;

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
      neighborhood:
        this.checkoutForm.controls.neighborhood.value,
      city: this.checkoutForm.controls.city.value,
      state: this.checkoutForm.controls.state.value,
      complement:
        this.checkoutForm.controls.complement.value,
    };

    const customerName =
      this.checkoutForm.get('fullName')?.value?.trim() ||
      this.auth.getName() ||
      'Cliente';

    if (paymentMethod === OrderPaymentMethod.CreditCard) {
      this.paymentApiService
        .criarPedidoTeste(this.totalValue)
        .subscribe({
          next: (payment) => {
            this.orderService.createOrder(
              this.cart.selectedCartItems(),
              customerName,
              this.cart.selectedSubtotal(),
              this.discountTotalValue,
              0,
              paymentMethod,
              address,
              OrderStatus.Pending,
              payment.id,
            );

            this.cart.removeCoupon();
            this.cart.removeSelectedItems();

            window.location.href = payment.checkoutUrl;
          },

          error: (error) => {
            console.error(
              'Erro ao iniciar pagamento:',
              error,
            );
          },
        });

      return;
    }

    if (
      paymentMethod === OrderPaymentMethod.Pix ||
      paymentMethod === OrderPaymentMethod.Boleto
    ) {
      this.orderService.createOrder(
        this.cart.selectedCartItems(),
        customerName,
        this.cart.selectedSubtotal(),
        this.discountTotalValue,
        0,
        paymentMethod,
        address,
        OrderStatus.Confirmed,
      );
    } else {
      this.orderService.createOrder(
        this.cart.selectedCartItems(),
        customerName,
        this.cart.selectedSubtotal(),
        this.discountTotalValue,
        0,
        paymentMethod,
        address,
      );
    }

    this.cart.removeCoupon();
    this.cart.removeSelectedItems();

    this.router.navigate(['/orders']);
  }
}

function nameNoSpecialChars(
  control: AbstractControl,
): ValidationErrors | null {
  const value = control.value;

  if (!value) {
    return null;
  }

  if (!/^[A-Za-zÀ-ÖØ-öø-ÿ\s]+$/.test(value)) {
    return { charsInvalid: true };
  }

  return null;
}

function validCep(
  control: AbstractControl,
): ValidationErrors | null {
  const value = control.value;

  if (!value) {
    return null;
  }

  if (!/^\d{5}-?\d{3}$/.test(value)) {
    return { invalidCep: true };
  }

  return null;
}

function validPhone(
  control: AbstractControl,
): ValidationErrors | null {
  const value = control.value;

  if (!value) {
    return null;
  }

  if (!/^\(?\d{2}\)?\s?9?\d{4}-?\d{4}$/.test(value)) {
    return { invalidPhone: true };
  }

  return null;
}

function nameNoNumbers(
  control: AbstractControl,
): ValidationErrors | null {
  const value = control.value;

  if (!value) {
    return null;
  }

  if (/\d/.test(value)) {
    return { numberInvalid: true };
  }

  return null;
}

function validCardNumber(
  control: AbstractControl,
): ValidationErrors | null {
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

  return sum % 10 === 0
    ? null
    : { invalidCardNumber: true };
}

function validCardExpiration(
  control: AbstractControl,
): ValidationErrors | null {
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

  if (
    year < currentYear ||
    (year === currentYear && month < currentMonth)
  ) {
    return { expiredCard: true };
  }

  return null;
}

function validCardCvv(
  control: AbstractControl,
): ValidationErrors | null {
  const value = control.value;

  if (!value) {
    return null;
  }

  if (!/^\d{3,4}$/.test(value)) {
    return { invalidCardCvv: true };
  }

  return null;
}

function validCpf(
  control: AbstractControl,
): ValidationErrors | null {
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

function validInstallments(
  control: AbstractControl,
): ValidationErrors | null {
  const value = control.value;

  if (value === null || value === '') {
    return null;
  }

  if (!Number.isInteger(value) || value < 1 || value > 12) {
    return { invalidInstallments: true };
  }

  return null;
}

export function addBusinessDays(
  startDate: Date,
  businessDays: number,
): Date {
  const result = new Date(startDate);
  let remainingDays = Math.max(
    0,
    Math.trunc(businessDays),
  );

  while (remainingDays > 0) {
    result.setDate(result.getDate() + 1);

    const dayOfWeek = result.getDay();

    if (dayOfWeek !== 0 && dayOfWeek !== 6) {
      remainingDays -= 1;
    }
  }

  return result;
}

export function formatLongDate(date: Date): string {
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  }).format(date);
}

export function getDeliveryEstimate(
  startDate = new Date(),
): string {
  const firstDate = addBusinessDays(startDate, 5);
  const lastDate = addBusinessDays(startDate, 8);

  return `Receba entre ${formatLongDate(firstDate)} e ${formatLongDate(lastDate)}`;
}

export function formatDigitableLine(
  digits: string,
): string {
  const normalizedDigits = digits
    .replace(/\D/g, '')
    .padEnd(47, '0')
    .slice(0, 47);

  return [
    `${normalizedDigits.slice(0, 5)}.${normalizedDigits.slice(5, 10)}`,
    `${normalizedDigits.slice(10, 15)}.${normalizedDigits.slice(15, 21)}`,
    `${normalizedDigits.slice(21, 26)}.${normalizedDigits.slice(26, 32)}`,
    normalizedDigits.slice(32, 33),
    normalizedDigits.slice(33, 47),
  ].join(' ');
}

function randomDigits(length: number): string {
  const values = new Uint8Array(length);

  if (
    typeof crypto !== 'undefined' &&
    crypto.getRandomValues
  ) {
    crypto.getRandomValues(values);
  } else {
    for (let index = 0; index < length; index += 1) {
      values[index] = Math.floor(Math.random() * 256);
    }
  }

  return Array.from(values, (value) =>
    String(value % 10),
  ).join('');
}