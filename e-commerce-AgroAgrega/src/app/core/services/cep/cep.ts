import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { CepModel } from '@models/cep.model';

@Injectable({
  providedIn: 'root',
})
export class CepService {
  private readonly http = inject(HttpClient);

  private readonly apiUrl = 'https://viacep.com.br/ws';

  getCep(cep: string) {
    return this.http.get<CepModel>(`${this.apiUrl}/${cep}/json/`);
  }
}
