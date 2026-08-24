import {
  ChangeDetectionStrategy,
  Component,
  inject
} from '@angular/core';

import { CurrencyPipe } from '@angular/common';
import { FavoritesService } from '@core/services/favorites/favorites.service';

@Component({
  selector: 'app-favorites',
  standalone: true,
  imports: [
    CurrencyPipe
  ],
  templateUrl: './favorites.component.html',
  styleUrl: './favorites.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class FavoritesComponent {

  readonly favoritesService = inject(FavoritesService);

  readonly favorites =
    this.favoritesService.favorites;

  remove(id: number): void {
    this.favoritesService.remove(id);
  }

}