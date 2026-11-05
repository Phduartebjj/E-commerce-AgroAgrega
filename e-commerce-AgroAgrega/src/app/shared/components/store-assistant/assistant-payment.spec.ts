import { parseAssistantPaymentRequest } from './assistant-payment';
import { interpretAssistantMessage } from './assistant-intent';

describe('Simulações de preço do Tourino', () => {
  it.each([
    ['Quanto ficam 3 desses no Pix?', 3, 'desses', 10],
    ['Quanto custam duas roçadeiras no Pix?', 2, 'rocadeiras', 10],
    ['Quanto fica sensor de umidade em 3x?', 1, 'sensor de umidade', 3],
    ['Calcule duas unidades do segundo em 3 parcelas', 2, 'do segundo', 3],
    ['Quanto custa o segundo no Pix?', 1, 'o segundo', 10],
    ['Quanto fica bomba solar 1,5 CV em 10x?', 1, 'bomba solar 1,5 cv', 10],
    ['Quanto custam 0 unidades desse?', 0, 'desse', 10],
    ['Quanto ficam -2 unidades desse?', -2, '- desse', 10],
    ['Quanto ficam 1,5 unidades desse?', 1.5, 'desse', 10],
    ['Quanto fica esse em 24 parcelas?', 1, 'esse', 24],
  ])('separa quantidade, referência e parcelas em %s', (message, quantity, query, installments) => {
    const parsed = parseAssistantPaymentRequest(message);
    expect(parsed.quantity).toBe(quantity);
    expect(parsed.query.replace(/\s+/g, ' ')).toBe(query);
    expect(parsed.installments).toBe(installments);
    expect(interpretAssistantMessage(message).type).toBe('payment');
  });
});
