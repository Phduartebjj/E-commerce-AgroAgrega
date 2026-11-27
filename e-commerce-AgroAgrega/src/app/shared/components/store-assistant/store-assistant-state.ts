import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class StoreAssistantState {
  readonly open = signal(false);

  show(): void {
    this.open.set(true);
  }
}
