import { productsItems } from '../../core/data/products';
import { CepModel } from '../../models/cep.model';
import { simulateShipping } from './shipping-simulation';

const address = (uf: string): CepModel => ({
  cep: '01001000', logradouro: '', complemento: '', bairro: '', localidade: 'Cidade', uf,
});

describe('Simulação de frete', () => {
  it('atende todos os estados e o Distrito Federal com prazo e valor positivos', () => {
    const states = 'AC AL AP AM BA CE DF ES GO MA MT MS MG PA PB PR PE PI RJ RN RS RO RR SC SP SE TO'.split(' ');
    for (const state of states) {
      const quote = simulateShipping(productsItems[0], 1, '01001000', address(state));
      expect(quote.simulated).toBe(true);
      expect(quote.options).toHaveLength(2);
      expect(quote.options.every((option) => Number.isFinite(option.price) && option.price > 0 &&
        option.deliveryDays.min > 0 && option.deliveryDays.max >= option.deliveryDays.min)).toBe(true);
    }
  });

  it('calcula opções para todos os produtos sem confundir preço com peso', () => {
    for (const product of productsItems) {
      const first = simulateShipping(product, 1, '01001000', address('SP'));
      const second = simulateShipping(product, 2, '01001000', address('SP'));
      expect(first.options[0].price).toBeGreaterThan(0);
      expect(second.options[0].price).toBeGreaterThan(first.options[0].price);
      expect(first.options[1].price).toBeGreaterThan(first.options[0].price);
      expect(first.options[1].deliveryDays.max).toBeLessThan(first.options[0].deliveryDays.max);
    }
  });

  it('diferencia o destino local de um trajeto para outra região', () => {
    const local = simulateShipping(productsItems[0], 1, '20211060', address('RJ'));
    const remote = simulateShipping(productsItems[0], 1, '69000000', address('AM'));
    expect(local.options[0].price).toBeLessThan(remote.options[0].price);
    expect(local.options[0].deliveryDays.max).toBeLessThan(remote.options[0].deliveryDays.max);
  });

  it('considera o peso informado no título quando disponível', () => {
    const product = { ...productsItems[0], category: 'Insumos' as const, title: 'Sementes 5 kg' };
    const light = simulateShipping(product, 1, '01001000', address('SP'));
    const heavy = simulateShipping({ ...product, title: 'Sementes 25 kg' }, 1, '01001000', address('SP'));
    expect(heavy.options[0].price).toBeGreaterThan(light.options[0].price);
  });
});
