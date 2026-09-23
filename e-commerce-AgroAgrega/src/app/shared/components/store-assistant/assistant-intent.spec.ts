import { productsItems } from '../../../core/data/products';
import { findAssistantProducts, interpretAssistantMessage } from './assistant-intent';

// Verifica a interpretação dos comandos enviados ao assistente da loja.
describe('assistant commands', () => {
  it('understands catalog, offers and coupon requests', () => {
    expect(interpretAssistantMessage('Ver ofertas de hoje').type).toBe('offers');
    expect(interpretAssistantMessage('Quantos produtos tem?').type).toBe('counts');
    expect(interpretAssistantMessage('Tem no estoque?').type).toBe('stock');
    expect(interpretAssistantMessage('Quero conhecer o Agro+')).toEqual({
      type: 'navigate', path: '/agro-plus', label: 'Conhecer Agro+',
    });
    expect(interpretAssistantMessage('Aplicar cupom CAMPO15')).toEqual({
      type: 'applyCoupon', code: 'CAMPO15',
    });
  });

  it('understands additions and safe quantity changes', () => {
    expect(interpretAssistantMessage('Adicione 2 sementes de milho ao carrinho')).toEqual({
      type: 'add', query: 'sementes de milho', quantity: 2,
    });
    expect(interpretAssistantMessage('Aumente 2 unidades de roçadeira')).toEqual({
      type: 'increase', query: 'rocadeira', quantity: 2,
    });
    expect(interpretAssistantMessage('Ajustar quantidade de roçadeira para 3')).toEqual({
      type: 'setQuantity', query: 'rocadeira', quantity: 3,
    });
    expect(interpretAssistantMessage('Aumentar quantidade de roçadeira para 4')).toEqual({
      type: 'setQuantity', query: 'rocadeira', quantity: 4,
    });
    expect(interpretAssistantMessage('Remova roçadeira do carrinho')).toEqual({
      type: 'remove', query: 'rocadeira', quantity: 0,
    });
  });

  it('matches products despite accents and plural words', () => {
    expect(findAssistantProducts(productsItems, 'roçadeiras')[0].title).toContain('Roçadeira');
    expect(findAssistantProducts(productsItems, 'sementes milho')[0].title).toContain('Sementes de milho');
    expect(findAssistantProducts(productsItems, 'um produto desconhecido')).toEqual([]);
  });
});
