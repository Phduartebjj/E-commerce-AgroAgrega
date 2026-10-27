import { productsItems } from '../../../core/data/products';
import { findAssistantProducts } from './assistant-intent';
import {
  hasAssistantReference, mergeAssistantCatalogRequest, parseAssistantCatalogRequest, resolveAssistantReferences, searchAssistantCatalog,
} from './assistant-catalog';

describe('Busca e contexto do Tourino', () => {
  it.each([
    ['Irrigação até R$ 1.500,50', 1500.5],
    ['Quero ferramentas com orçamento de 1,5 mil reais', 1500],
    ['Procuro sensores por menos de 500 reais', 500],
  ])('entende o orçamento em “%s”', (message, maxPrice) => {
    const request = parseAssistantCatalogRequest(message);
    expect(request.maxPrice).toBe(maxPrice);
    const results = searchAssistantCatalog(productsItems, request);
    expect(results.length).toBeGreaterThan(0);
    expect(results.every((product) => product.price <= maxPrice)).toBe(true);
  });

  it('filtra por faixa de preço e ordena os resultados pelo menor valor', () => {
    const request = parseAssistantCatalogRequest('Quero ferramentas entre R$ 100 e R$ 500, das mais baratas');
    expect(request.minPrice).toBe(100);
    expect(request.maxPrice).toBe(500);
    const results = searchAssistantCatalog(productsItems, request);
    expect(results.length).toBeGreaterThan(0);
    expect(results.every((product) => product.category === 'Ferramentas' && product.price >= 100 && product.price <= 500)).toBe(true);
    expect(results.map((product) => product.price)).toEqual(results.map((product) => product.price).sort((a, b) => a - b));
  });

  it('separa a capacidade do equipamento de um valor monetário', () => {
    const request = parseAssistantCatalogRequest('Bomba solar 1,5 CV');
    expect(request.maxPrice).toBeUndefined();
    expect(request.minPrice).toBeUndefined();
    expect(request.query).toContain('1 5');
    expect(hasAssistantReference(request.query)).toBe(false);
    expect(resolveAssistantReferences(request.query, productsItems.slice(0, 4))).toEqual([]);
  });

  it('relaciona uma necessidade de uso aos produtos do catálogo', () => {
    const request = parseAssistantCatalogRequest('Me ajude a escolher um produto para irrigar uma horta até R$ 800');
    const results = searchAssistantCatalog(productsItems, request);
    expect(results.length).toBeGreaterThan(0);
    expect(results.every((product) => product.price <= 800)).toBe(true);
    expect(results.some((product) => /gotejamento|aspersor/i.test(product.title))).toBe(true);
  });

  it('entende sinônimos, palavras com erro e buscas por alternativas', () => {
    expect(findAssistantProducts(productsItems, 'roçadera', 4, true)[0].title).toContain('Roçadeira');
    expect(findAssistantProducts(productsItems, 'adubo', 52).some((product) => product.title.includes('Fertilizante'))).toBe(true);
    const alternatives = searchAssistantCatalog(productsItems, parseAssistantCatalogRequest('Buscar sementes e fertilizantes'));
    expect(alternatives.some((product) => product.title.includes('Sementes'))).toBe(true);
    expect(alternatives.some((product) => product.title.includes('Fertilizante'))).toBe(true);
    expect(findAssistantProducts(productsItems, 'equipamento intergalactico inexistente', 4, true)).toEqual([]);
  });

  it('mantém o orçamento ao selecionar ofertas ou itens com melhor avaliação', () => {
    const products = productsItems.map((product, index) => ({ ...product, flashOffer: index % 2 === 0 }));
    const request = parseAssistantCatalogRequest('Ofertas de ferramentas até R$ 500 com melhores avaliações');
    const results = searchAssistantCatalog(products, request);
    expect(results.length).toBeGreaterThan(0);
    expect(results.every((product) => product.flashOffer && product.price <= 500 && product.category === 'Ferramentas')).toBe(true);
    expect(results.map((product) => product.rating)).toEqual(results.map((product) => product.rating).sort((a, b) => b - a));
  });

  it('resolve as opções visíveis e não inventa uma opção fora da lista', () => {
    const products = productsItems.slice(0, 3);
    expect(resolveAssistantReferences('o segundo', products)).toEqual([products[1]]);
    expect(resolveAssistantReferences('compare o primeiro com o terceiro', products)).toEqual([products[0], products[2]]);
    expect(resolveAssistantReferences('opção 2', products)).toEqual([products[1]]);
    expect(resolveAssistantReferences('o quarto', products)).toEqual([]);
    expect(resolveAssistantReferences('o mais barato', products)[0].price).toBe(Math.min(...products.map((product) => product.price)));
  });

  it('filtra marcas em conjunto sem confundir seus nomes com características do produto', () => {
    const request = parseAssistantCatalogRequest('Quero produtos da MultiGrão ou da Biomatrix até R$ 500');
    expect(request.brands).toEqual(['Biomatrix', 'MultiGrão']);
    expect(request.query).toBe('');
    const results = searchAssistantCatalog(productsItems, request);
    expect(results.length).toBeGreaterThan(1);
    expect(new Set(results.map((product) => product.brand))).toEqual(new Set(['Biomatrix', 'MultiGrão']));
    expect(results.every((product) => product.price <= 500)).toBe(true);
  });

  it('exclui tipos de produto e marcas sem transformar a restrição em busca positiva', () => {
    const request = parseAssistantCatalogRequest('Quero insumos sem sementes, exceto AgroSense até R$ 500');
    expect(request.query).toBe('insumos');
    expect(request.excludeTerms).toEqual(['sementes']);
    expect(request.excludeBrands).toEqual(['AgroSense']);
    const results = searchAssistantCatalog(productsItems, request);
    expect(results.length).toBeGreaterThan(0);
    expect(results.every((product) => product.category === 'Insumos' && !/sementes/i.test(product.title) && product.brand !== 'AgroSense' && product.price <= 500)).toBe(true);
  });

  it('entende recusas e exclusões acumuladas com sinônimos', () => {
    let request = parseAssistantCatalogRequest('Buscar insumos');
    request = mergeAssistantCatalogRequest(request, parseAssistantCatalogRequest('Não quero adubo'), 'Não quero adubo');
    request = mergeAssistantCatalogRequest(request, parseAssistantCatalogRequest('Sem sementes'), 'Sem sementes');
    expect(request.query).toBe('insumos');
    expect(request.excludeTerms).toEqual(['adubo', 'sementes']);
    const results = searchAssistantCatalog(productsItems, request);
    const excluded = findAssistantProducts(productsItems, 'adubo', productsItems.length, true);
    expect(results.every((product) => !/sementes/i.test(product.title) && !excluded.some((entry) => entry.id === product.id))).toBe(true);
  });

  it.each(['com nota acima de 4,5', 'com avaliação mínima de 4,5', 'com pelo menos 4,5 estrelas'])(
    'separa nota e dinheiro em “%s”', (rating) => {
      const request = parseAssistantCatalogRequest(`Ferramentas até R$ 500 ${rating}`);
      expect(request.minRating).toBe(4.5);
      expect(request.minPrice).toBeUndefined();
      expect(request.maxPrice).toBe(500);
      const results = searchAssistantCatalog(productsItems, request);
      expect(results.length).toBeGreaterThan(0);
      expect(results.every((product) => product.rating >= 4.5 && product.price <= 500 && product.category === 'Ferramentas')).toBe(true);
    },
  );

  it('mantém categoria e orçamento ao refinar marca, nota e ordenação', () => {
    let request = parseAssistantCatalogRequest('Irrigação até R$ 800');
    for (const message of ['Só AgroSense', 'Com nota mínima 4,5', 'Mais baratos']) {
      request = mergeAssistantCatalogRequest(request, parseAssistantCatalogRequest(message), message);
    }
    expect(request).toMatchObject({ query: 'irrigacao', category: 'Irrigação', maxPrice: 800, brands: ['AgroSense'], minRating: 4.5, sort: 'cheapest' });
    const results = searchAssistantCatalog(productsItems, request);
    expect(results.length).toBeGreaterThan(0);
    expect(results.every((product) => product.category === 'Irrigação' && product.brand === 'AgroSense' && product.rating >= 4.5 && product.price <= 800)).toBe(true);
    expect(results.map((product) => product.price)).toEqual(results.map((product) => product.price).sort((a, b) => a - b));
  });

  it('limpa apenas o orçamento e preserva o assunto e as exclusões', () => {
    const previous = parseAssistantCatalogRequest('Ferramentas entre R$ 100 e R$ 300 sem AgroSense');
    const request = mergeAssistantCatalogRequest(previous, parseAssistantCatalogRequest('Sem limite de preço'), 'Sem limite de preço');
    expect(request).toMatchObject({ query: 'ferramentas', category: 'Ferramentas', excludeBrands: ['AgroSense'] });
    expect(request.minPrice).toBeUndefined();
    expect(request.maxPrice).toBeUndefined();
    expect(request.clearBudget).toBeUndefined();
    const results = searchAssistantCatalog(productsItems, request);
    expect(results.some((product) => product.price > 300)).toBe(true);
    expect(results.every((product) => product.category === 'Ferramentas' && product.brand !== 'AgroSense')).toBe(true);
  });

  it('reinicia as restrições quando o cliente muda de necessidade', () => {
    const previous = parseAssistantCatalogRequest('Insumos até R$ 50 sem sementes da Biomatrix');
    const message = 'Agora quero ferramentas';
    const request = mergeAssistantCatalogRequest(previous, parseAssistantCatalogRequest(message), message);
    expect(request).toEqual({ query: 'ferramentas', category: 'Ferramentas' });
    expect(searchAssistantCatalog(productsItems, request).some((product) => product.price > 50)).toBe(true);
  });

  it('permite escolher explicitamente uma marca excluída na etapa anterior', () => {
    const previous = parseAssistantCatalogRequest('Insumos exceto Biomatrix');
    const message = 'Só Biomatrix';
    const request = mergeAssistantCatalogRequest(previous, parseAssistantCatalogRequest(message), message);
    const results = searchAssistantCatalog(productsItems, request);
    expect(results.length).toBeGreaterThan(0);
    expect(results.every((product) => product.brand === 'Biomatrix')).toBe(true);
  });
});
