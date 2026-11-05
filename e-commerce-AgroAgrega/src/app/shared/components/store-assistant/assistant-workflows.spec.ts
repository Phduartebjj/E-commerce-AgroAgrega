import { productsItems } from '../../../core/data/products';
import { buildAssistantShoppingPlan, detectAssistantShoppingPlan } from './assistant-workflows';

describe('Seleções de compras do Tourino', () => {
  it('separa uma seleção solicitada de uma busca comum por kit', () => {
    expect(detectAssistantShoppingPlan('Monte uma seleção de ferramentas até R$ 1000')).toBe(true);
    expect(detectAssistantShoppingPlan('Buscar kit de irrigação')).toBe(false);
  });
  it('limita a soma de todos os produtos ao orçamento', () => {
    const plan = buildAssistantShoppingPlan(productsItems, 'Monte uma seleção de ferramentas até R$ 1000');
    expect(plan.products.length).toBeGreaterThan(0);
    expect(plan.products.length).toBeLessThanOrEqual(3);
    expect(plan.products.every(product => product.category === 'Ferramentas')).toBe(true);
    expect(plan.total).toBeLessThanOrEqual(1000);
    expect(plan.total).toBe(Math.round(plan.products.reduce((sum, product) => sum + product.price, 0) * 100) / 100);
    expect(new Set(plan.products.map(product => product.id)).size).toBe(plan.products.length);
  });
  it('não relaxa o orçamento nem as exclusões para completar três produtos', () => {
    expect(buildAssistantShoppingPlan(productsItems, 'Monte uma seleção de ferramentas até R$ 1').products).toEqual([]);
    const plan = buildAssistantShoppingPlan(productsItems, 'Monte uma seleção de insumos sem sementes até R$ 500');
    expect(plan.products.length).toBeGreaterThan(0);
    expect(plan.products.every(product => product.category === 'Insumos' && !/sementes/i.test(product.title))).toBe(true);
    expect(plan.total).toBeLessThanOrEqual(500);
  });
});
