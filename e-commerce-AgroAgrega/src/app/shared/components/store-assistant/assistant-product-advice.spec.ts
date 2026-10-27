import { productsItems } from '../../../core/data/products';
import { ProductModel } from '../../../models/product';
import { answerAssistantFeatureQuestion, isAssistantFeatureQuestion } from './assistant-product-advice';

describe('assistant product advice', () => {
  const product = (id: string): ProductModel => productsItems.find((item) => item.id === id)!;

  it('recognizes feature follow-ups without turning product searches into follow-ups', () => {
    for (const query of ['É elétrico?', 'Tem bluetooth?', 'O segundo é bivolt?', 'Funciona com energia solar?', 'Quanto pesa?', 'Qual a voltagem?', 'Qual a dosagem?', 'É compatível com meu sistema?']) {
      expect(isAssistantFeatureQuestion(query), query).toBe(true);
    }
    for (const query of ['Tem sementes?', 'Tem roçadeira elétrica?', 'Buscar bateria', 'Quero uma bomba solar']) {
      expect(isAssistantFeatureQuestion(query), query).toBe(false);
    }
  });

  it('quotes the actual solar power and battery information', () => {
    const solar = answerAssistantFeatureQuestion(product('agro-025'), 'É solar? Qual a potência?');
    expect(solar).toContain('Alimentação solar: o catálogo informa “Bomba Submersa Solar 750 W”');
    expect(solar).toContain('Potência: o catálogo informa “Bomba Submersa Solar 750 W”');
    expect(answerAssistantFeatureQuestion(product('agro-046'), 'Tem bateria?')).toContain('Pulverizador Costal a Bateria 20 L');
  });

  it('does not infer missing connectivity, voltage or power from unrelated values', () => {
    expect(answerAssistantFeatureQuestion(product('agro-024'), 'Tem bluetooth?')).toContain('Bluetooth: não está informada');
    expect(answerAssistantFeatureQuestion(product('agro-050'), 'Qual a voltagem?')).toContain('Tensão: não está informada');
    const mower = productsItems.find((item) => item.title.startsWith('Roçadeira'))!;
    expect(answerAssistantFeatureQuestion(mower, 'Qual a potência?')).toContain('Potência: não está informada');
    expect(answerAssistantFeatureQuestion(mower, 'É elétrico?')).toContain('Alimentação elétrica: não está informada');
  });

  it('distinguishes explicit negative evidence from a missing feature', () => {
    const sample = { ...product('agro-024'), description: 'Este controlador não possui Bluetooth. Conexão Wi-Fi integrada.' };
    const response = answerAssistantFeatureQuestion(sample, 'Tem bluetooth?');
    expect(response).toContain('o catálogo informa “Este controlador não possui Bluetooth.”');
    expect(response).not.toContain('Sim');
  });

  it('uses title units for voltage and capacity without treating package count as a dose', () => {
    expect(answerAssistantFeatureQuestion(product('agro-026'), 'Qual a tensão?')).toContain('24 V');
    expect(answerAssistantFeatureQuestion(product('agro-032'), 'Qual a capacidade?')).toContain('120 L');
    const response = answerAssistantFeatureQuestion(product('agro-039'), 'Quantas doses por hectare?');
    expect(response).toContain('não bastam para definir uma dose');
    expect(response).not.toContain('Use 5');
  });

  it('does not infer compatibility from generic product descriptions', () => {
    const response = answerAssistantFeatureQuestion(product('agro-025'), 'Funciona com meu painel?');
    expect(response).toContain('Não há dados suficientes');
    expect(response).toContain('confirmar essa compatibilidade');
  });

  it('does not use customer reviews as technical evidence', () => {
    const sample = { ...product('agro-024'), reviews: [{ stars: 5, text: 'Adorei o Bluetooth!' }] };
    expect(answerAssistantFeatureQuestion(sample, 'Tem Bluetooth?')).toContain('não está informada no cadastro');
  });
});
