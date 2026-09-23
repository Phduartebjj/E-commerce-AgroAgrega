import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

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

  private readonly apiUrl =
    'https://invited-ottawa-scenario-caution.trycloudflare.com/api/payments';

  criarPedidoTeste(totalAmount: number): Observable<PaymentResponse> {
    return this.http.post<PaymentResponse>(this.apiUrl, {
      totalAmount,
    });
  }

  consultarPedido(orderId: string): Observable<PaymentStatusResponse> {
    return this.http.get<PaymentStatusResponse>(
      `${this.apiUrl}/${orderId}`,
    );
  }
}