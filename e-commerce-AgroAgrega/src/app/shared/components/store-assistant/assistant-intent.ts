import { ProductModel } from '../../../models/product';

export type AssistantIntent =
  | { type: 'help' }
  | { type: 'counts' }
  | { type: 'stock' }
  | { type: 'cart' }
  | { type: 'offers' }
  | { type: 'popular' }
  | { type: 'coupons' }
  | { type: 'applyCoupon'; code: string }
  | { type: 'navigate'; path: string; label: string }
  | { type: 'search' | 'details'; query: string }
  | { type: 'add' | 'remove' | 'increase' | 'decrease' | 'setQuantity'; query: string; quantity: number };

const SEARCH_PREFIX = /^(?:busque|buscar|pesquise|pesquisar|procure|procurar|procuro|encontre|encontrar|mostre|mostrar|quero ver|preciso de|tem)\s+/;
const CART_SUFFIX = /\s+(?:(?:ao?|no|do|para o)\s+)?carrinho(?:\s+de\s+compras)?$/;
const FILLER = new Set([
  'a', 'agora', 'as', 'com', 'da', 'das', 'de', 'do', 'dos', 'e', 'em', 'eu', 'favor', 'gostaria', 'hoje',
  'me', 'meu', 'minha', 'mim', 'no', 'na', 'o', 'os', 'para', 'por', 'preciso', 'produto',
  'produtos', 'quero', 'um', 'uma',
]);

export function normalizeAssistantText(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase('pt-BR')
    .replace(/[^a-z0-9+\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function subject(value: string): string {
  return value.replace(CART_SUFFIX, '').replace(/^(?:o|a|os|as|um|uma|de)\s+/, '').trim();
}

function amount(value: string): number {
  const match = value.match(/\b(\d{1,2})\s*(?:unidades?|itens?)\b|\b(?:em|mais|menos)\s+(\d{1,2})\b/);
  return match ? Number(match[1] ?? match[2]) : 1;
}

export function interpretAssistantMessage(message: string): AssistantIntent {
  const text = normalizeAssistantText(message);
  if (!text || /^(?:oi|ola|bom dia|boa tarde|boa noite|ajuda|o que voce faz)$/.test(text)) {
    return { type: 'help' };
  }

  const coupon = text.match(/^(?:aplicar|ative|ativar|usar|use)\s+(?:o\s+)?cupom\s+([a-z0-9]+)/);
  if (coupon) return { type: 'applyCoupon', code: coupon[1].toUpperCase() };
  if (/\bcupons?\b/.test(text)) return { type: 'coupons' };

  if (/^(?:abrir|abra|ir para|acesse|acessar)\s+(?:o\s+)?carrinho$/.test(text)) {
    return { type: 'navigate', path: '/cart', label: 'Abrir carrinho' };
  }
  if (/^(?:abrir|abra|ir para|acesse|acessar)\s+(?:o\s+)?catalogo$/.test(text)) {
    return { type: 'navigate', path: '/products', label: 'Abrir catálogo' };
  }
  if (/^(?:abrir|abra|ir para|acesse|acessar|ver)\s+(?:meus?\s+)?pedidos?$/.test(text)) {
    return { type: 'navigate', path: '/orders', label: 'Ver pedidos' };
  }
  if (/^(?:abrir|abra|ir para|acesse|acessar|ver)\s+(?:minha\s+)?conta$/.test(text)) {
    return { type: 'navigate', path: '/account', label: 'Abrir minha conta' };
  }
  if (/\bagro\s*\+|\bagro plus\b/.test(text)) {
    return { type: 'navigate', path: '/agro-plus', label: 'Conhecer Agro+' };
  }

  if (/^(?:remover|remova|retirar|retire|excluir|exclua|tire|tirar)\s+/.test(text)) {
    return {
      type: 'remove',
      query: subject(text.replace(/^(?:remover|remova|retirar|retire|excluir|exclua|tire|tirar)\s+/, '')),
      quantity: 0,
    };
  }

  const setQuantity = text.match(/^(?:ajustar|ajuste|alterar|altere|mudar|mude|definir|defina|deixar|deixe|aumentar|aumente|diminuir|diminua)\s+(?:a\s+)?quantidade\s+(?:de\s+)?(.+?)\s+(?:para|em|com)\s+(\d{1,2})(?:\s+unidades?)?$/);
  if (setQuantity) {
    return { type: 'setQuantity', query: subject(setQuantity[1]), quantity: Number(setQuantity[2]) };
  }

  const adjust = text.match(/^(aumentar|aumente|acrescentar|acrescente|diminuir|diminua|reduzir|reduza)\s+(?:a\s+quantidade\s+(?:de\s+)?)?(.+)$/);
  if (adjust) {
    const quantity = amount(adjust[2]);
    const query = subject(adjust[2]
      .replace(/^(?:(?:em|mais|menos)\s+)?\d{1,2}\s*(?:unidades?\s*(?:de\s+)?)?/, '')
      .replace(/\s+(?:em|mais|menos)\s+\d{1,2}\s*(?:unidades?)?$/, ''));
    return { type: /^(?:diminuir|diminua|reduzir|reduza)$/.test(adjust[1]) ? 'decrease' : 'increase', query, quantity };
  }

  const add = text.match(/^(?:adicionar|adicione|adiciona|colocar|coloque|coloca|incluir|inclua|comprar|quero comprar|quero adicionar|quero)\s+(.+)$/);
  if (add && !/^(?:ver|saber|pesquisar|buscar)\b/.test(add[1])) {
    const leadingQuantity = add[1].match(/^(\d{1,2})\s*(?:unidades?\s*(?:de\s+)?)?/);
    const quantity = leadingQuantity ? Number(leadingQuantity[1]) : amount(add[1]);
    const query = subject(leadingQuantity ? add[1].slice(leadingQuantity[0].length) : add[1]);
    return { type: 'add', query, quantity };
  }

  if (/\b(?:estoque|disponibilidade)\b/.test(text)) return { type: 'stock' };
  if (/\b(?:quantos?|quantas?)\b/.test(text)) return { type: 'counts' };
  if (/\b(?:carrinho|meus itens|minhas compras)\b/.test(text)) return { type: 'cart' };
  if (/\b(?:ofertas?|promocoes?|relampago)\b/.test(text)) return { type: 'offers' };
  if (/\b(?:mais vendidos|mais procurados|populares)\b/.test(text)) return { type: 'popular' };

  const details = text.match(/^(?:quanto custa|qual o preco (?:de|do|da)|preco (?:de|do|da)|informacoes sobre|fale sobre)\s+(.+)$/);
  if (details) return { type: 'details', query: subject(details[1]) };

  return { type: 'search', query: subject(text.replace(SEARCH_PREFIX, '')) };
}

function stem(word: string): string {
  return word.length > 4 && word.endsWith('s') ? word.slice(0, -1) : word;
}

export function findAssistantProducts(products: ProductModel[], query: string, limit = 4): ProductModel[] {
  const words = normalizeAssistantText(query)
    .split(' ')
    .filter((word) => word.length > 1 && !FILLER.has(word))
    .map(stem);
  if (!words.length) return [];

  return products
    .map((product) => {
      const title = normalizeAssistantText(product.title);
      const category = normalizeAssistantText(product.category);
      const description = normalizeAssistantText(product.description);
      const titleWords = title.split(' ').map(stem);
      const categoryWords = category.split(' ').map(stem);
      const descriptionWords = description.split(' ').map(stem);
      const matches = words.every((word) =>
        [...titleWords, ...categoryWords, ...descriptionWords].some((candidate) =>
          candidate.length >= 3 && (candidate.startsWith(word) || word.startsWith(candidate)),
        ),
      );
      if (!matches) return { product, score: 0 };

      const score = words.reduce((total, word) =>
        total + (titleWords.some((candidate) => candidate.startsWith(word)) ? 10 : 0)
          + (categoryWords.some((candidate) => candidate.startsWith(word)) ? 4 : 0)
          + (descriptionWords.some((candidate) => candidate.startsWith(word)) ? 1 : 0), 0,
      ) + (title.includes(normalizeAssistantText(query)) ? 30 : 0);
      return { product, score };
    })
    .filter((item) => item.score > 0)
    .sort((first, second) => second.score - first.score || first.product.title.localeCompare(second.product.title, 'pt-BR'))
    .slice(0, limit)
    .map((item) => item.product);
}
