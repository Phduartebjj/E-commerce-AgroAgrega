import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';

import { AddressService } from './address.service';

// Verifica o salvamento, a leitura e o tratamento de endereços do usuário.
describe('AddressService', () => {
  let service: AddressService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(AddressService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('deve salvar, carregar e retornar lista vazia de endereços', () => {
    const addresses = [{
      id: 'address-1',
      fullName: 'Cliente',
      cep: '12345-678',
      address: 'Rua A',
      number: '10',
      neighborhood: 'Centro',
      city: 'São Paulo',
      state: 'SP',
    }];

    expect(service.getAddresses('user-1')).toEqual([]);
    service.saveAddresses('user-1', addresses);
    expect(service.getAddresses('user-1')).toEqual(addresses);
  });
});
