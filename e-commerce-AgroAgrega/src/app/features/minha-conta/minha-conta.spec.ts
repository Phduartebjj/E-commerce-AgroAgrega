import { signal } from '@angular/core';
import { vi } from 'vitest';
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
    localStorage.clear();
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

  it('should render the 22 mascot images and update the profile when a new one is chosen', async () => {
    const host = fixture.nativeElement as HTMLElement;
    expect(host.querySelectorAll('.avatar-options button')).toHaveLength(22);
    expect(host.querySelectorAll('.avatar-options img.avatar-art')).toHaveLength(22);
    const option = host.querySelector('[data-avatar="hat-tip"]')!.closest('button')!;
    option.click();
    await fixture.whenStable();
    expect(option.getAttribute('aria-pressed')).toBe('true');
    expect(host.querySelector('.profile-avatar--current img')?.getAttribute('src')).toBe(
      '/assets/images/avatars/hat-tip.png',
    );
  });

  it('should open the gallery from the camera without forcing capture', () => {
    const input = fixture.nativeElement.querySelector('input[type="file"]') as HTMLInputElement;
    const click = vi.spyOn(input, 'click');
    fixture.nativeElement.querySelector('.camera-button').click();
    expect(click).toHaveBeenCalledOnce();
    expect(input.hasAttribute('capture')).toBe(false);
    expect(input.accept).toContain('image/jpeg');
  });

  it('should keep the current avatar and show feedback for an invalid photo', async () => {
    component.selectAvatar('sunglasses');
    const input = document.createElement('input');
    Object.defineProperty(input, 'files', {
      value: [new File(['text'], 'file.txt', { type: 'text/plain' })],
    });
    await component.onPhotoSelected({ target: input } as unknown as Event);
    await fixture.whenStable();
    expect(component.avatar.isSelected('sunglasses')).toBe(true);
    expect(fixture.nativeElement.querySelector('[role="alert"]').textContent).toContain(
      'Escolha uma imagem',
    );
    expect(component.photoLoading()).toBe(false);
  });

  it('should leave the selection unchanged when the gallery is cancelled', async () => {
    component.selectAvatar('waving');
    const input = document.createElement('input');
    await component.onPhotoSelected({ target: input } as unknown as Event);
    expect(component.avatar.isSelected('waving')).toBe(true);
    expect(component.photoError()).toBe('');
  });
});
