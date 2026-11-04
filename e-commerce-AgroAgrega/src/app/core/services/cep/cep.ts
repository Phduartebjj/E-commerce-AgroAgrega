import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { CepModel } from '@models/cep.model';
import { catchError, map, throwError, timeout } from 'rxjs';

interface BrasilApiCep {
  cep: string;
  street?: string;
  neighborhood?: string;
  city: string;
  state: string;
}

@Injectable({
  providedIn: 'root',
})
export class CepService {
  private readonly http = inject(HttpClient);

  private readonly apiUrl = 'https://viacep.com.br/ws';

  getCep(cep: string) {
    const normalized = cep.replace(/\D/g, '');
    if (!/^\d{8}$/.test(normalized)) {
      return throwError(() => new Error('Informe um CEP válido com 8 dígitos.'));
    }
    return this.http.get<CepModel>(`${this.apiUrl}/${normalized}/json/`).pipe(
      timeout(4000),
      catchError((error: unknown) => {
        if (error instanceof HttpErrorResponse && (error.status === 400 || error.status === 404)) {
          return throwError(() => error);
        }
        return this.http.get<BrasilApiCep>(`https://brasilapi.com.br/api/cep/v1/${normalized}`).pipe(
          timeout(4000),
          map((address): CepModel => ({
            cep: address.cep,
            logradouro: address.street ?? '',
            complemento: '',
            bairro: address.neighborhood ?? '',
            localidade: address.city,
            uf: address.state,
          })),
        );
      }),
    );
  }
}
