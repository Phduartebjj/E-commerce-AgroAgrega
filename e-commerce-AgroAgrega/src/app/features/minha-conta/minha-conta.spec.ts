import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MinhaConta } from './minha-conta';

describe('MinhaConta', () => {
  let component: MinhaConta;
  let fixture: ComponentFixture<MinhaConta>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MinhaConta],
    }).compileComponents();

    fixture = TestBed.createComponent(MinhaConta);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should add a user address and persist it', () => {
    const user = component['auth'].register('Maria Teste', 'maria@teste.com', '123456');
    expect(user.res).toBeTrue();

    component.addAddress();
    component.addressForm.setValue({
      fullName: 'Maria Teste',
      cep: '12345-678',
      address: 'Rua das Flores',
      number: '123',
      neighborhood: 'Centro',
      city: 'São Paulo',
      state: 'SP',
      complement: 'Casa',
    });

    component.saveAddress();

    expect(component.userAddresses.length).toBe(1);
    expect(component.userAddresses[0].city).toBe('São Paulo');
  });
});
