import { ProductModel } from '../../../models/product';
import { AssistantCatalogRequest, mergeAssistantCatalogRequest, parseAssistantCatalogRequest, searchAssistantCatalog } from './assistant-catalog';
import { normalizeAssistantText } from './assistant-intent';

export function detectAssistantShoppingPlan(message: string): boolean {
  return /\b(?:monte|montar|crie|criar|organize|organizar|sugira)\s+(?:para mim\s+)?(?:uma?\s+)?(?:selecao|lista|conjunto|kit|compra)\b/.test(normalizeAssistantText(message));
}

export function buildAssistantShoppingPlan(products: ProductModel[], message: string, previous?: AssistantCatalogRequest) {
  const subject = message.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/\b(?:monte|montar|crie|criar|organize|organizar|sugira)\s+(?:para mim\s+)?(?:uma?\s+)?(?:selecao|lista|conjunto|kit|compra)(?:\s+de\s+produtos)?/i, '');
  const request = mergeAssistantCatalogRequest(previous, parseAssistantCatalogRequest(subject), subject);
  const budget = request.maxPrice;
  const ceiling = budget === undefined ? Infinity : Math.round(budget * 100);
  const candidates = searchAssistantCatalog(products, { ...request, sort: request.sort ?? 'value' })
    .filter((product, index, all) => Number.isFinite(product.price) && product.price > 0 && all.findIndex(item => item.id === product.id) === index);
  let selected: ProductModel[] = [];
  let totalCents = 0;
  let bestRank = Infinity;
  // Search combinations of up to three catalog items; monetary arithmetic stays in cents.
  const choose = (start: number, items: ProductModel[], cents: number, rank: number) => {
    if (items.length > selected.length || (items.length === selected.length && (rank < bestRank || (rank === bestRank && cents < totalCents)))) {
      selected = [...items]; totalCents = cents; bestRank = rank;
    }
    if (items.length === 3) return;
    for (let i = start; i < candidates.length; i++) {
      const next = cents + Math.round(candidates[i].price * 100);
      if (next <= ceiling) choose(i + 1, [...items, candidates[i]], next, rank + i);
    }
  };
  choose(0, [], 0, 0);
  return { products: selected, total: totalCents / 100, budget, request };
}
