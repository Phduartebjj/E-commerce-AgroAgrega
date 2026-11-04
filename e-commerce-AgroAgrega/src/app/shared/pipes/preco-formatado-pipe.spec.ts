import { PrecoFormatadoPipe } from './preco-formatado-pipe';

// Verifica se o pipe de preço pode ser instanciado corretamente.
describe('PrecoFormatadoPipe', () => {
  it('create an instance', () => {
    const pipe = new PrecoFormatadoPipe();
    expect(pipe).toBeTruthy();
  });
});
