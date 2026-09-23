import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { Auth } from '@core/services/auth/auth.service';
import { AvatarService } from './avatar.service';

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
});
