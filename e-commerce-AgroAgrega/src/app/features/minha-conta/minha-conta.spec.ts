import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { AddressService } from '@core/services/address/address.service';
import { Auth } from '@core/services/auth/auth.service';
import { CepService } from '@core/services/cep/cep';
import { OrderService } from '@core/services/order/order.service';

import { MinhaConta } from './minha-conta';

// Verifica a criação e o comportamento principal da área da conta do usuário.
describe('MinhaConta', () => {
  let component: MinhaConta;
  let fixture: ComponentFixture<MinhaConta>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MinhaConta],
      providers: [
        provideRouter([]),
        {
          provide: Auth,
          useValue: {
            currentUserId: signal(null),
            getName: () => 'Usuário Teste',
            getEmail: () => 'usuario@email.com',
            getId: () => 'user-1',
            updateProfile: () => ({ res: true, message: '' }),
            logout: () => undefined,
            removeAccount: () => true,
          },
        },
        {
          provide: OrderService,
          useValue: {
            getOrdersByUserId: () => [],
          },
        },
        {
          provide: AddressService,
          useValue: {
            getAddresses: () => [],
            saveAddresses: () => undefined,
          },
        },
        {
          provide: CepService,
          useValue: {
            getCep: () => ({ subscribe: () => undefined }),
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(MinhaConta);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should show the available avatars when the picker opens', async () => {
    const openButton = fixture.nativeElement.querySelector(
      '[aria-controls="avatar-picker"]',
    ) as HTMLButtonElement;
    openButton.click();
    await fixture.whenStable();

    const host = fixture.nativeElement as HTMLElement;
    expect(host.querySelectorAll('.avatar-options button')).toHaveLength(50);
    expect(host.textContent).toContain('Cavalo');
    expect(host.textContent).toContain('Ovelha');
    expect(host.textContent).toContain('Galinha');
    expect(host.textContent).toContain('Porquinho');
    expect(host.textContent).toContain('Cão do campo');
    expect(host.textContent).toContain('Abelha');
  });
});
