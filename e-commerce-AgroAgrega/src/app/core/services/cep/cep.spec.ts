import { TestBed } from '@angular/core/testing';

import { CepService } from './cep';

// Verifica a criação do serviço responsável pela consulta de CEP.
describe('CepService', () => {
  let service: CepService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(CepService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
