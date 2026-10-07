import { signal } from '@angular/core';
import { vi } from 'vitest';
import { TestBed } from '@angular/core/testing';

import { Auth } from '@core/services/auth/auth.service';
import { AvatarService } from './avatar.service';

// Verifica o avatar padrão e a persistência do avatar escolhido.
describe('AvatarService', () => {
  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [
        {
          provide: Auth,
          useValue: {
            currentUserId: signal<string | null>('user-1'),
            getId: () => 'user-1',
          },
        },
      ],
    });
  });

  it('should use the producer avatar by default', () => {
    const service = TestBed.inject(AvatarService);

    expect(service.selectedAvatar().id).toBe('farmer');
  });

  it('should save and expose the selected avatar', () => {
    const service = TestBed.inject(AvatarService);

    service.selectAvatar('tractor');

    expect(service.selectedAvatar().id).toBe('tractor');
    expect(localStorage.getItem('agroagrega-avatar-user-1')).toBe('tractor');
  });

  it('should include animal avatars and persist an animal selection', () => {
    const service = TestBed.inject(AvatarService);

    expect(service.options).toHaveLength(50);
    expect(new Set(service.options.map((option) => option.id)).size).toBe(50);
    expect(
      service.options.filter((option) => ['horse', 'sheep', 'chicken', 'pig'].includes(option.id)),
    ).toHaveLength(4);

    service.selectAvatar('horse');

    expect(service.selectedAvatar().label).toBe('Cavalo');
    expect(localStorage.getItem('agroagrega-avatar-user-1')).toBe('horse');
  });

  it('should restore a saved photo and clear it when choosing an avatar', () => {
    localStorage.setItem('agroagrega-avatar-photo-user-1', 'data:image/jpeg;base64,photo');
    const service = TestBed.inject(AvatarService);
    TestBed.tick();
    expect(service.customPhoto()).toBe('data:image/jpeg;base64,photo');
    expect(service.isSelected('farmer')).toBe(false);
    service.selectAvatar('tractor');
    expect(service.customPhoto()).toBeNull();
    expect(localStorage.getItem('agroagrega-avatar-photo-user-1')).toBeNull();
    expect(service.isSelected('tractor')).toBe(true);
  });

  it('should isolate photos by account and clear them from view on logout', () => {
    localStorage.setItem('agroagrega-avatar-photo-user-1', 'data:image/jpeg;base64,one');
    localStorage.setItem('agroagrega-avatar-photo-user-2', 'data:image/jpeg;base64,two');
    const service = TestBed.inject(AvatarService);
    const auth = TestBed.inject(Auth);
    TestBed.tick();
    expect(service.customPhoto()).toBe('data:image/jpeg;base64,one');
    auth.currentUserId.set('user-2');
    TestBed.tick();
    expect(service.customPhoto()).toBe('data:image/jpeg;base64,two');
    auth.currentUserId.set(null);
    TestBed.tick();
    expect(service.customPhoto()).toBeNull();
  });

  it('should reject unsupported and oversized files before reading them', async () => {
    const service = TestBed.inject(AvatarService);
    await expect(
      service.selectPhoto(new File(['x'], 'file.svg', { type: 'image/svg+xml' })),
    ).rejects.toThrow('Escolha uma imagem');
    const large = new File(['x'], 'large.png', { type: 'image/png' });
    Object.defineProperty(large, 'size', { value: 11 * 1024 * 1024 });
    await expect(service.selectPhoto(large)).rejects.toThrow('10 MB');
  });

  it('should keep the previous selection when photo storage fails', async () => {
    const service = TestBed.inject(AvatarService);
    TestBed.tick();
    service.selectAvatar('horse');
    vi.spyOn(
      service as unknown as { preparePhoto: (file: File) => Promise<string> },
      'preparePhoto',
    ).mockResolvedValue('data:image/jpeg;base64,test');
    const storage = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new DOMException('Quota exceeded', 'QuotaExceededError');
    });
    try {
      await expect(
        service.selectPhoto(new File(['x'], 'photo.png', { type: 'image/png' })),
      ).rejects.toThrow('Não foi possível salvar');
      expect(service.isSelected('horse')).toBe(true);
      expect(service.customPhoto()).toBeNull();
    } finally {
      storage.mockRestore();
      vi.restoreAllMocks();
    }
  });
});
