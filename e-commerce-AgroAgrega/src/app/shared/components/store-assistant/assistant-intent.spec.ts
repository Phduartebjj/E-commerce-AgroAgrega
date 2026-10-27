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

  it('preserves the date suffix when applying a daily coupon', () => {
    expect(interpretAssistantMessage('Aplicar cupom COLHEITA15-20261013')).toEqual({
      type: 'applyCoupon',
      code: 'COLHEITA15-20261013',
    });
    expect(interpretAssistantMessage('use o cupom raiz10-20261014')).toEqual({
      type: 'applyCoupon',
      code: 'RAIZ10-20261014',
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

  it.each([
    ['Quero uma roçadeira', 'search'],
    ['Quero ver sensores de umidade', 'search'],
    ['Me indique irrigação para horta até R$ 500', 'recommend'],
    ['Quero comprar uma bomba até R$ 800', 'recommend'],
    ['Compare o primeiro com o segundo', 'compare'],
    ['Quanto fica o segundo no Pix?', 'payment'],
    ['Qual o frete desse produto?', 'shipping'],
    ['Qual é o melhor cupom?', 'coupons'],
    ['Quantos itens no carrinho?', 'cart'],
    ['Opção 2', 'select'],
    ['Obrigado pela ajuda', 'thanks'],
    ['Cancelar', 'cancel'],
  ])('entende “%s” sem confundir a intenção', (message, type) => {
    expect(interpretAssistantMessage(message).type).toBe(type);
  });

  it('preserva quantidades para validar limites em vez de truncá-las', () => {
    expect(interpretAssistantMessage('Adicione duas roçadeiras')).toEqual({ type: 'add', query: 'rocadeiras', quantity: 2 });
    expect(interpretAssistantMessage('Adicione 100 roçadeiras')).toEqual({ type: 'add', query: 'rocadeiras', quantity: 100 });
    expect(interpretAssistantMessage('Adicione 0 roçadeiras')).toEqual({ type: 'add', query: 'rocadeiras', quantity: 0 });
    expect(interpretAssistantMessage('Adicione -2 roçadeiras')).toMatchObject({ type: 'add', quantity: -1 });
    expect(interpretAssistantMessage('Quero 2 desse')).toEqual({ type: 'add', query: 'desse', quantity: 2 });
  });

  it.each([
    ['Outras opções', 'more'],
    ['Mais opções', 'more'],
    ['Ver mais produtos', 'more'],
    ['Tem alguma outra opção?', 'more'],
    ['Mostre mais', 'more'],
    ['Desfaça', 'undo'],
    ['Desfazer última alteração', 'undo'],
    ['Desfaça a última ação no carrinho', 'undo'],
    ['Recomeçar busca', 'reset'],
    ['Comece de novo', 'reset'],
    ['Limpar filtros', 'reset'],
    ['Por que recomendou esse?', 'explain'],
    ['Por que o segundo?', 'explain'],
    ['Explique sua recomendação', 'explain'],
    ['Como economizar água na horta?', 'recommend'],
    ['Mais barato que esse', 'recommend'],
    ['Mais barata do que essa', 'recommend'],
    ['Qual desses é melhor para minha horta?', 'compare'],
    ['Qual compensa mais?', 'compare'],
    ['Qual vale mais a pena?', 'compare'],
    ['Compare os dois', 'compare'],
    ['Compare todos', 'compare'],
  ])('entende a continuação “%s”', (message, type) => {
    expect(interpretAssistantMessage(message).type).toBe(type);
  });

  it('distingue preferências negativas de cancelamentos e ações no carrinho', () => {
    expect(interpretAssistantMessage('Não quero adubo')).toEqual({ type: 'search', query: 'nao quero adubo' });
    expect(interpretAssistantMessage('Não quero produtos da AgroSense')).toMatchObject({ type: 'search' });
    expect(interpretAssistantMessage('Não quero mais')).toEqual({ type: 'cancel' });
    expect(interpretAssistantMessage('Não adicione o segundo')).toEqual({ type: 'cancel' });
    expect(interpretAssistantMessage('Não remova as sementes')).toEqual({ type: 'cancel' });
    expect(interpretAssistantMessage('Por favor não aplique cupom CAMPO15')).toEqual({ type: 'cancel' });
    expect(interpretAssistantMessage('Não ajuste a quantidade do primeiro para 3')).toEqual({ type: 'cancel' });
    expect(interpretAssistantMessage('Mais 2')).toEqual({ type: 'increase', query: '', quantity: 2 });
    expect(interpretAssistantMessage('O mais barato')).toEqual({ type: 'select', query: 'o mais barato' });
  });

  it('preserva perguntas de característica para responder com os dados do produto', () => {
    expect(interpretAssistantMessage('É elétrico?')).toEqual({ type: 'details', query: 'e eletrico' });
    expect(interpretAssistantMessage('Tem Bluetooth?')).toEqual({ type: 'details', query: 'tem bluetooth' });
    expect(interpretAssistantMessage('O segundo é bivolt?')).toEqual({ type: 'details', query: 'o segundo e bivolt' });
    expect(interpretAssistantMessage('Quanto pesa?')).toEqual({ type: 'details', query: 'quanto pesa' });
    expect(interpretAssistantMessage('Tem sementes?').type).toBe('search');
    expect(interpretAssistantMessage('Tem roçadeira elétrica?').type).toBe('search');
    expect(interpretAssistantMessage('Por que o frete é caro?').type).toBe('shipping');
  });
});
