import { inject, Injectable, InjectionToken } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError, timeout } from 'rxjs';

// Provide the server URL in app.config.ts when using a payment backend.
// With no provider the project runs its local demonstration checkout.
export const PAYMENT_API_URL = new InjectionToken<string>('PAYMENT_API_URL', {
  providedIn: 'root', factory: () => '',
});

export interface PaymentResponse {
  id: string;
  status: string;
  checkoutUrl: string;
  totalAmount: string;
}

export interface PaymentStatusResponse {
  id: string;
  status: string;
  statusDetail: string;
  totalAmount: string;
  totalPaidAmount: number;
}

@Injectable({
  providedIn: 'root',
})
export class PaymentApiService {
  private readonly http = inject(HttpClient);

  private readonly apiUrl = inject(PAYMENT_API_URL);
  readonly enabled = Boolean(this.apiUrl);

  criarPedidoTeste(totalAmount: number): Observable<PaymentResponse> {
    if (!this.enabled) return throwError(() => new Error('Pagamento externo não configurado.'));
    return this.http.post<PaymentResponse>(this.apiUrl, {
      totalAmount,
    }).pipe(timeout(15000));
  }

  consultarPedido(orderId: string): Observable<PaymentStatusResponse> {
    if (!this.enabled) return throwError(() => new Error('Pagamento externo não configurado.'));
    return this.http.get<PaymentStatusResponse>(
      `${this.apiUrl}/${orderId}`,
    ).pipe(timeout(10000));
  }
}
