import { isPlatformBrowser } from '@angular/common';
import { computed, effect, inject, Injectable, PLATFORM_ID, signal } from '@angular/core';

import { Auth } from '@core/services/auth/auth.service';

export interface AvatarOption {
  id: string;
  label: string;
  glyph: string;
}

const AVATAR_OPTIONS = [
  { id: 'farmer', label: 'Produtor', glyph: '🧑‍🌾' },
  { id: 'sprout', label: 'Broto', glyph: '🌱' },
  { id: 'tractor', label: 'Trator', glyph: '🚜' },
  { id: 'cattle', label: 'Pecuária', glyph: '🐄' },
  { id: 'sunflower', label: 'Girassol', glyph: '🌻' },
  { id: 'harvest', label: 'Colheita', glyph: '🌾' },
  { id: 'horse', label: 'Cavalo', glyph: '🐴' },
  { id: 'sheep', label: 'Ovelha', glyph: '🐑' },
  { id: 'chicken', label: 'Galinha', glyph: '🐔' },
  { id: 'pig', label: 'Porquinho', glyph: '🐷' },
  { id: 'farm-dog', label: 'Cão do campo', glyph: '🐕' },
  { id: 'bee', label: 'Abelha', glyph: '🐝' },
  { id: 'goat', label: 'Bode', glyph: '🐐' },
  { id: 'ox', label: 'Boi', glyph: '🐂' },
  { id: 'buffalo', label: 'Búfalo', glyph: '🐃' },
  { id: 'dairy-cow', label: 'Vaquinha', glyph: '🐮' },
  { id: 'rooster', label: 'Galo', glyph: '🐓' },
  { id: 'chick', label: 'Pintinho', glyph: '🐥' },
  { id: 'duck', label: 'Pato', glyph: '🦆' },
  { id: 'turkey', label: 'Peru', glyph: '🦃' },
  { id: 'rabbit', label: 'Coelho', glyph: '🐇' },
  { id: 'llama', label: 'Lhama', glyph: '🦙' },
  { id: 'donkey', label: 'Burrinho', glyph: '🫏' },
  { id: 'camel', label: 'Camelo', glyph: '🐫' },
  { id: 'deer', label: 'Cervo', glyph: '🦌' },
  { id: 'boar', label: 'Javali', glyph: '🐗' },
  { id: 'cat', label: 'Gato', glyph: '🐈' },
  { id: 'mouse', label: 'Ratinho', glyph: '🐁' },
  { id: 'owl', label: 'Coruja', glyph: '🦉' },
  { id: 'eagle', label: 'Águia', glyph: '🦅' },
  { id: 'parrot', label: 'Papagaio', glyph: '🦜' },
  { id: 'butterfly', label: 'Borboleta', glyph: '🦋' },
  { id: 'ladybug', label: 'Joaninha', glyph: '🐞' },
  { id: 'ant', label: 'Formiga', glyph: '🐜' },
  { id: 'snail', label: 'Caracol', glyph: '🐌' },
  { id: 'frog', label: 'Sapo', glyph: '🐸' },
  { id: 'fish', label: 'Peixe', glyph: '🐟' },
  { id: 'pine-tree', label: 'Pinheiro', glyph: '🌲' },
  { id: 'tree', label: 'Árvore', glyph: '🌳' },
  { id: 'palm', label: 'Palmeira', glyph: '🌴' },
  { id: 'cactus', label: 'Cacto', glyph: '🌵' },
  { id: 'clover', label: 'Trevo', glyph: '🍀' },
  { id: 'corn', label: 'Milho', glyph: '🌽' },
  { id: 'carrot', label: 'Cenoura', glyph: '🥕' },
  { id: 'apple', label: 'Maçã', glyph: '🍎' },
  { id: 'grape', label: 'Uva', glyph: '🍇' },
  { id: 'water', label: 'Água', glyph: '💧' },
  { id: 'sun', label: 'Sol', glyph: '☀️' },
  { id: 'rain', label: 'Chuva', glyph: '🌧️' },
  { id: 'farm', label: 'Fazenda', glyph: '🏡' },
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
