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

  readonly options = AVATAR_OPTIONS;

  readonly selectedAvatar = computed(
    () => this.options.find((avatar) => avatar.id === this.selectedId()) ?? this.options[0],
  );

  constructor() {
    effect(() => {
      const userId = this.auth.currentUserId();
      this.selectedId.set(this.readAvatar(userId));
    });
  }

  isSelected(avatarId: AvatarId): boolean {
    return this.selectedId() === avatarId;
  }

  selectAvatar(avatarId: AvatarId): void {
    if (!this.options.some((avatar) => avatar.id === avatarId)) {
      return;
    }

    const userId = this.auth.currentUserId() || this.auth.getId();
    this.selectedId.set(avatarId);

    if (this.browser && userId) {
      localStorage.setItem(this.storageKey(userId), avatarId);
    }
  }

  private readAvatar(userId: string | null): AvatarId {
    if (!this.browser || !userId) {
      return this.defaultAvatar;
    }

    const storedAvatar = localStorage.getItem(this.storageKey(userId)) as AvatarId | null;
    return storedAvatar && this.options.some((avatar) => avatar.id === storedAvatar)
      ? storedAvatar
      : this.defaultAvatar;
  }

  private storageKey(userId: string): string {
    return `agroagrega-avatar-${userId}`;
  }
}
