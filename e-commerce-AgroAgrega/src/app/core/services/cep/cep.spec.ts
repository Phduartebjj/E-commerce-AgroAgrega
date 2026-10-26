import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';

import { CepService } from './cep';

// Verifica a criação do serviço responsável pela consulta de CEP.
describe('CepService', () => {
  let service: CepService;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    service = TestBed.inject(CepService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('normaliza o CEP formatado antes de consultar o endereço', () => {
    const http = TestBed.inject(HttpTestingController);
    service.getCep('20211-060').subscribe();
    http.expectOne('https://viacep.com.br/ws/20211060/json/').flush({
      cep: '20211-060', localidade: 'Rio de Janeiro', uf: 'RJ',
    });
    http.verify();
  });
});
