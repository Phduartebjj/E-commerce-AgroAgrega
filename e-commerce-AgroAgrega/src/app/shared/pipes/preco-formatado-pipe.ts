import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'precoFormatado',
})
export class PrecoFormatadoPipe implements PipeTransform {
  transform(value: number): string {
    return 'R$' + value.toFixed(2)
  }
}
