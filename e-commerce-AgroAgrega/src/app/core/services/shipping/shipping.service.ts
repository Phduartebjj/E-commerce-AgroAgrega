import { HttpErrorResponse } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { catchError, map, Observable, throwError, timeout } from 'rxjs';
import { ProductModel } from '../../../models/product';
import { ShippingQuote } from '../../../models/shipping';
import { simulateShipping } from '../../../shared/utils/shipping-simulation';
import { CepService } from '../cep/cep';

@Injectable({ providedIn: 'root' })
export class ShippingService {
  private readonly cep = inject(CepService);

  quote(product: ProductModel, quantity: number, postalCode: string): Observable<ShippingQuote> {
    const cep = postalCode.replace(/\D/g, '');
    if (!/^\d{8}$/.test(cep) || /^0{8}$/.test(cep)) {
      return throwError(() => new Error('Informe um CEP válido com 8 dígitos.'));
    }
    if (!Number.isInteger(quantity) || quantity < 1 || quantity > 100) {
      return throwError(() => new Error('Simule o frete de 1 a 100 unidades por consulta.'));
    }
    return this.cep.getCep(cep).pipe(
      timeout(12000),
      catchError((error: unknown) => {
        const message = error instanceof HttpErrorResponse
          ? error.status === 404 || error.status === 400
            ? 'CEP não encontrado. Confira os números e tente novamente.'
            : 'Não foi possível consultar seu CEP agora. Verifique a conexão e tente novamente.'
          : error instanceof Error && error.name === 'TimeoutError'
            ? 'A consulta do CEP demorou para responder. Tente novamente.'
            : 'Não foi possível consultar seu CEP agora. Verifique a conexão e tente novamente.';
        return throwError(() => new Error(message));
      }),
      map((address) => {
        if (address.erro || !address.localidade || !address.uf) {
          throw new Error('CEP não encontrado. Confira os números e tente novamente.');
        }
        return simulateShipping(product, quantity, cep, address);
      }),
    );
  }
}
