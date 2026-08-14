import { Pipe } from '@angular/core';

@Pipe({
  name: 'precoFormatado',
  standalone: true,
})
export class PrecoFormatadoPipe {
  transform(value: number): string {
    return 'R$ ' + value.toFixed(2);
  }
}
