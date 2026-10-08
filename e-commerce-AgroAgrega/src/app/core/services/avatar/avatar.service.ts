import { isPlatformBrowser } from '@angular/common';
import { computed, effect, inject, Injectable, PLATFORM_ID, signal } from '@angular/core';

import { Auth } from '@core/services/auth/auth.service';

export interface AvatarOption {
  id: string;
  label: string;
  image: string;
}

const AVATAR_OPTIONS = [
  { id: 'farmer', label: 'Produtor', image: '/assets/images/avatars/farmer.png' },
  { id: 'waving', label: 'Boas-vindas', image: '/assets/images/avatars/waving.png' },
  { id: 'smiling', label: 'Sorridente', image: '/assets/images/avatars/smiling.png' },
  { id: 'thumbs-up', label: 'Positivo', image: '/assets/images/avatars/thumbs-up.png' },
  { id: 'pointing', label: 'Parceiro', image: '/assets/images/avatars/pointing.png' },
  { id: 'celebrating', label: 'Comemorando', image: '/assets/images/avatars/celebrating.png' },
  { id: 'thinking', label: 'Pensativo', image: '/assets/images/avatars/thinking.png' },
  { id: 'winking', label: 'Piscadinha', image: '/assets/images/avatars/winking.png' },
  { id: 'sunglasses', label: 'Estiloso', image: '/assets/images/avatars/sunglasses.png' },
  { id: 'joyful', label: 'Alegria', image: '/assets/images/avatars/joyful.png' },
  { id: 'welcoming', label: 'Acolhedor', image: '/assets/images/avatars/welcoming.png' },
  { id: 'confident', label: 'Confiante', image: '/assets/images/avatars/confident.png' },
  {
    id: 'classic-portrait',
    label: 'Clássico',
    image: '/assets/images/avatars/classic-portrait.png',
  },
  { id: 'waving-full', label: 'Acenando', image: '/assets/images/avatars/waving-full.png' },
  { id: 'thumbs-up-full', label: 'Tudo certo', image: '/assets/images/avatars/thumbs-up-full.png' },
  { id: 'pointing-full', label: 'É com você', image: '/assets/images/avatars/pointing-full.png' },
  { id: 'victory', label: 'Vitória', image: '/assets/images/avatars/victory.png' },
  { id: 'thinking-full', label: 'Refletindo', image: '/assets/images/avatars/thinking-full.png' },
  { id: 'open-arms', label: 'Abraço', image: '/assets/images/avatars/open-arms.png' },
  { id: 'hat-tip', label: 'Saudação', image: '/assets/images/avatars/hat-tip.png' },
  { id: 'hands-on-hips', label: 'Determinado', image: '/assets/images/avatars/hands-on-hips.png' },
  { id: 'arms-crossed', label: 'Tranquilo', image: '/assets/images/avatars/arms-crossed.png' },
] as const satisfies readonly AvatarOption[];

export type AvatarId = (typeof AVATAR_OPTIONS)[number]['id'];

@Injectable({ providedIn: 'root' })
export class AvatarService {
  private readonly auth = inject(Auth);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly browser = isPlatformBrowser(this.platformId);
  private readonly defaultAvatar: AvatarId = 'farmer';
  private readonly selectedId = signal<AvatarId>(this.defaultAvatar);
  private readonly photo = signal<string | null>(null);
  private selectionVersion = 0;

  readonly options = AVATAR_OPTIONS;
  readonly customPhoto = this.photo.asReadonly();

  readonly selectedAvatar = computed(
    () => this.options.find((avatar) => avatar.id === this.selectedId()) ?? this.options[0],
  );

  constructor() {
    effect(() => {
      const userId = this.auth.currentUserId();
      this.selectionVersion++;
      this.selectedId.set(this.readAvatar(userId));
      this.photo.set(this.readPhoto(userId));
    });
  }

  isSelected(avatarId: AvatarId): boolean {
    return !this.photo() && this.selectedId() === avatarId;
  }

  selectAvatar(avatarId: AvatarId): void {
    if (!this.options.some((avatar) => avatar.id === avatarId)) {
      return;
    }

    const userId = this.auth.currentUserId() || this.auth.getId();
    if (this.browser && userId) {
      localStorage.setItem(this.storageKey(userId), avatarId);
      localStorage.removeItem(this.photoStorageKey(userId));
    }
    this.selectionVersion++;
    this.selectedId.set(avatarId);
    this.photo.set(null);
  }

  async selectPhoto(file: File): Promise<void> {
    if (!/^image\/(jpeg|png|webp|gif|avif|bmp)$/i.test(file.type)) {
      throw new Error('Escolha uma imagem JPG, PNG, WebP, GIF, AVIF ou BMP.');
    }
    if (file.size > 10 * 1024 * 1024) {
      throw new Error('A imagem deve ter no máximo 10 MB.');
    }
    const userId = this.auth.currentUserId() || this.auth.getId();
    if (!this.browser || !userId) {
      throw new Error('Entre na sua conta para escolher uma foto.');
    }
    const version = ++this.selectionVersion;
    const photo = await this.preparePhoto(file);
    if (
      version !== this.selectionVersion ||
      userId !== (this.auth.currentUserId() || this.auth.getId())
    ) {
      return;
    }
    try {
      localStorage.setItem(this.photoStorageKey(userId), photo);
    } catch {
      throw new Error(
        'Não foi possível salvar a foto neste dispositivo. Libere espaço e tente novamente.',
      );
    }
    this.photo.set(photo);
  }

  private async preparePhoto(file: File): Promise<string> {
    const url = URL.createObjectURL(file);
    try {
      const image = new Image();
      await new Promise<void>((resolve, reject) => {
        image.onload = () => resolve();
        image.onerror = () =>
          reject(new Error('Não foi possível abrir esta imagem. Escolha outra foto.'));
        image.src = url;
      });
      const side = Math.min(image.naturalWidth, image.naturalHeight);
      if (!side) throw new Error('A imagem selecionada é inválida.');
      const canvas = document.createElement('canvas');
      canvas.width = canvas.height = Math.min(side, 384);
      const context = canvas.getContext('2d');
      if (!context) throw new Error('Não foi possível preparar a foto. Tente novamente.');
      context.fillStyle = '#f0f7ee';
      context.fillRect(0, 0, canvas.width, canvas.height);
      context.drawImage(
        image,
        (image.naturalWidth - side) / 2,
        (image.naturalHeight - side) / 2,
        side,
        side,
        0,
        0,
        canvas.width,
        canvas.height,
      );
      return canvas.toDataURL('image/jpeg', 0.85);
    } finally {
      URL.revokeObjectURL(url);
    }
  }

  private readPhoto(userId: string | null): string | null {
    if (!this.browser || !userId) return null;
    try {
      const photo = localStorage.getItem(this.photoStorageKey(userId));
      return photo?.startsWith('data:image/jpeg;base64,') ? photo : null;
    } catch {
      return null;
    }
  }

  private readAvatar(userId: string | null): AvatarId {
    if (!this.browser || !userId) {
      return this.defaultAvatar;
    }

    try {
      const storedAvatar = localStorage.getItem(this.storageKey(userId)) as AvatarId | null;
      return storedAvatar && this.options.some((avatar) => avatar.id === storedAvatar)
        ? storedAvatar
        : this.defaultAvatar;
    } catch {
      return this.defaultAvatar;
    }
  }

  private storageKey(userId: string): string {
    return `agroagrega-avatar-${userId}`;
  }

  private photoStorageKey(userId: string): string {
    return `agroagrega-avatar-photo-${userId}`;
  }
}
