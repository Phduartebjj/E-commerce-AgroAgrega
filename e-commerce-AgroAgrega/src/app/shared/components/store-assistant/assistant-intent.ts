import { ProductModel } from '../../../models/product';
import { isAssistantFeatureQuestion } from './assistant-product-advice';

export type AssistantIntent =
  | { type: 'help' }
  | { type: 'thanks' | 'cancel' | 'more' | 'undo' | 'reset' }
  | { type: 'select' | 'compare' | 'recommend' | 'payment' | 'shipping' | 'explain'; query: string }
  | { type: 'policy'; topic: 'returns' | 'warranty' }
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
  'produtos', 'quero', 'um', 'uma', 'opcao', 'opcoes', 'algum', 'alguma', 'porfavor',
]);

const QUANTITY_WORDS: Record<string, number> = {
  um: 1, uma: 1, dois: 2, duas: 2, tres: 3, quatro: 4, cinco: 5,
  seis: 6, sete: 7, oito: 8, nove: 9, dez: 10,
};

const SYNONYMS = [
  ['adubo', 'adubacao', 'adubar', 'fertilizante', 'fertilizacao'],
  ['irrigacao', 'irrigar', 'regar', 'rega'],
  ['bovino', 'gado', 'boi', 'vaca'],
  ['ave', 'galinha', 'aviario'],
  ['capim', 'braquiaria', 'pastagem'],
  ['rocadeira', 'aparador'],
  ['horta', 'hortalica', 'gotejamento', 'microaspersao'],
];

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
  return value.replace(CART_SUFFIX, '').replace(/^(?:o|a|os|as|um|uma|de|do|da)\s+/, '').trim();
}

function amount(value: string): number {
  const match = value.match(/\b(\d{1,3})\s*(?:unidades?|itens?)\b|\b(?:em|mais|menos)\s+(\d{1,3})\b/);
  return match ? Number(match[1] ?? match[2]) : 1;
}

export function interpretAssistantMessage(message: string): AssistantIntent {
  const text = normalizeAssistantText(message);
  if (/^(?:adicionar|adicione|adiciona|colocar|coloque|coloca|incluir|inclua|comprar|quero adicionar)\s+-\s*\d/i.test(message.trim())) {
    return { type: 'add', query: '', quantity: -1 };
  }
  if (!text || /^(?:oi|ola|bom dia|boa tarde|boa noite|ajuda|o que voce faz|quem e voce|o que voce pode fazer)(?: tourino)?(?: tudo bem)?$/.test(text)) {
    return { type: 'help' };
  }
  if (/^(?:obrigad[oa]|valeu|muito obrigad[oa]|otimo|perfeito)(?: tourino| pela ajuda)?$/.test(text)) return { type: 'thanks' };
  if (/^(?:cancelar|cancele|cancela|deixa pra la|deixe para la|nao|nao quero mais)(?:\s+(?:isso|essa acao|a escolha|por favor))?$/.test(text) ||
      /^(?:por favor\s+)?nao\s+(?:adicione|adiciona|adicionar|coloque|coloca|colocar|inclua|incluir|remova|remover|retire|retirar|altere|alterar|ajuste|aumente|diminu[ai]|aplique|aplicar|compre|comprar)\b/.test(text)) {
    return { type: 'cancel' };
  }
  if (/^(?:desfaca|desfazer|desfaz)(?:\s+(?:(?:a|o)\s+)?(?:ultima?\s+)?(?:alteracao|acao|mudanca|adicao|remocao|ajuste|isso)(?:\s+(?:no|do) carrinho)?)?$/.test(text) ||
      /^(?:voltar|volte) atras$/.test(text)) return { type: 'undo' };
  if (/^(?:recomecar|recomece|reiniciar|reinicie)(?:\s+(?:a\s+)?(?:busca|pesquisa|conversa))?$/.test(text) ||
      /^(?:comecar de novo|comece de novo|nova busca|nova pesquisa|limpar filtros|esqueca os filtros)$/.test(text)) return { type: 'reset' };
  if (/^(?:(?:ver|veja|mostrar|mostre|quero ver|quero|tem|ha)\s+)?(?:(?:mais|outras?|outros?)\s+(?:opcoes?|produtos?|alternativas?)|alguma outra opcao)(?:\s+(?:por favor|dessas|desses|como esse|como essa|desse tipo))?$/.test(text) || /^(?:ver|mostrar|mostre) mais$/.test(text)) {
    return { type: 'more' };
  }
  if (/^(?:por que|porque|por qual motivo)\s+(?:(?:voce\s+)?(?:recomendou|indicou|escolheu|sugeriu)\b|(?:(?:o|a)\s+)?(?:primeir[oa]|segund[oa]|terceir[oa]|quart[oa]|ess[ea]|est[ea])\b)/.test(text) ||
      /^(?:explique|explica)\s+(?:(?:a|sua|essa)\s+)?(?:recomendacao|escolha|indicacao)$/.test(text)) {
    return { type: 'explain', query: text };
  }
  if (/^(?:(?:o|a|esse|essa|entao o|entao a|opcao|produto|item)\s+)?(?:primeir[oa]|segund[oa]|terceir[oa]|quart[oa]|ultim[oa]|mais barat[oa]|mais car[oa]|[1-4])(?:\s+(?:opcao|produto|mesmo))?$/.test(text)) {
    return { type: 'select', query: text };
  }

  const coupon = message
    .trim()
    .match(/^(?:aplicar|ative|ativar|usar|use)\s+(?:o\s+)?cupom\s+([a-z0-9]+(?:-[a-z0-9]+)*)/i);
  if (coupon) return { type: 'applyCoupon', code: coupon[1].toUpperCase() };
  if (/\b(?:cupom|cupons)\b/.test(text)) return { type: 'coupons' };

  if (/^(?:abrir|abra|ir para|acesse|acessar)\s+(?:o\s+)?carrinho$/.test(text)) {
    return { type: 'navigate', path: '/cart', label: 'Abrir carrinho' };
  }
  if (/^(?:abrir|abra|ir para|acesse|acessar)\s+(?:o\s+)?catalogo$/.test(text)) {
    return { type: 'navigate', path: '/products', label: 'Abrir catálogo' };
  }
  if (/^(?:abrir|abra|ir para|acesse|acessar|ver)\s+(?:meus?\s+)?pedidos?$/.test(text) || /\b(?:rastrear|rastreio|acompanhar pedido|onde esta meu pedido)\b/.test(text)) {
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

  const setQuantity = text.match(/^(?:ajustar|ajuste|alterar|altere|mudar|mude|definir|defina|deixar|deixe|aumentar|aumente|diminuir|diminua)\s+(?:a\s+)?quantidade\s+(?:de\s+)?(.+?)\s+(?:para|em|com)\s+(\d{1,3})(?:\s+unidades?)?$/);
  if (setQuantity) {
    return { type: 'setQuantity', query: subject(setQuantity[1]), quantity: Number(setQuantity[2]) };
  }
  const more = text.match(/^(mais|menos)\s+(\d{1,3})(?:\s+unidades?)?$/);
  if (more) return { type: more[1] === 'mais' ? 'increase' : 'decrease', query: '', quantity: Number(more[2]) };

  const adjust = text.match(/^(aumentar|aumente|acrescentar|acrescente|diminuir|diminua|reduzir|reduza)\s+(?:a\s+quantidade\s+(?:de\s+)?)?(.+)$/);
  if (adjust) {
    const quantity = amount(adjust[2]);
    const query = subject(adjust[2]
      .replace(/^(?:(?:em|mais|menos)\s+)?\d{1,3}\s*(?:unidades?\s*(?:de\s+)?)?/, '')
      .replace(/\s+(?:em|mais|menos)\s+\d{1,3}\s*(?:unidades?)?$/, ''));
    return { type: /^(?:diminuir|diminua|reduzir|reduza)$/.test(adjust[1]) ? 'decrease' : 'increase', query, quantity };
  }

  const contextualWant = text.match(/^quero\s+(\d{1,3}|um|uma|dois|duas|tres|quatro|cinco)\s+(desses?|dessas?|deles?|delas?|do segundo|do primeiro|do terceiro|do quarto)$/);
  if (contextualWant) return { type: 'add', query: contextualWant[2], quantity: /^\d+$/.test(contextualWant[1]) ? Number(contextualWant[1]) : QUANTITY_WORDS[contextualWant[1]] };
  const add = text.match(/^(?:adicionar|adicione|adiciona|colocar|coloque|coloca|incluir|inclua|comprar|quero comprar|quero adicionar)\s+(.+)$/);
  if (add && !/^(?:ver|saber|pesquisar|buscar)\b/.test(add[1])) {
    if (/^(?:comprar|quero comprar)\b/.test(text) && /\b(?:ate|orcamento|melhor|barato|algo|algum)\b/.test(add[1])) return { type: 'recommend', query: text };
    const leadingQuantity = add[1].match(/^(\d{1,3}|um|uma|dois|duas|tres|quatro|cinco|seis|sete|oito|nove|dez)\b\s*(?:unidades?\s*(?:de\s+)?)?/);
    const quantity = leadingQuantity ? /^\d+$/.test(leadingQuantity[1]) ? Number(leadingQuantity[1]) : QUANTITY_WORDS[leadingQuantity[1]] : amount(add[1]);
    const query = subject(leadingQuantity ? add[1].slice(leadingQuantity[0].length) : add[1]);
    return { type: 'add', query, quantity };
  }

  if (/\b(?:comparar|compare|compara|comparacao|diferenca|qual (?:deles|desses|dessas|delas) (?:e |eh )?(?:melhor|compensa)|qual (?:compensa mais|vale mais a pena))\b/.test(text)) return { type: 'compare', query: text };
  if (/\b(?:devolucao|devolver|troca|trocar produto)\b/.test(text)) return { type: 'policy', topic: 'returns' };
  if (/\bgarantia\b/.test(text)) return { type: 'policy', topic: 'warranty' };
  if (/\b(?:frete|entrega|prazo|cep)\b/.test(text)) return { type: 'shipping', query: text };
  if (/\b(?:pix|parcelas?|parcelamento|cartao|boleto|pagamento)\b/.test(text) && !/\b(?:buscar|busque|procuro|recomende|indique)\b/.test(text)) return { type: 'payment', query: text };
  if (/\b(?:estoque|disponibilidade)\b/.test(text)) return { type: 'stock' };
  if (/\b(?:carrinho|meus itens|minhas compras)\b/.test(text)) return { type: 'cart' };
  if (isAssistantFeatureQuestion(text)) return { type: 'details', query: text };
  if (/\b(?:quantos?|quantas?)\b/.test(text)) return { type: 'counts' };
  if (/\b(?:ofertas?|promocoes?|relampago)\b/.test(text)) return { type: 'offers' };
  if (/\b(?:mais vendidos|mais procurados|populares)\b/.test(text)) return { type: 'popular' };

  const details = text.match(/^(?:quanto custa|qual (?:e )?o preco (?:de|do|da)|preco (?:de|do|da)|informacoes sobre|fale sobre|detalhes (?:de|do|da)|me fale sobre|o que e|para que serve|como funciona)\s+(.+)$/);
  if (details) return { type: 'details', query: subject(details[1]) };
  if (/^(?:mais detalhes|detalhes|quero saber mais)$/.test(text)) return { type: 'details', query: '' };
  if (/\b(?:recomenda|recomende|recomendacao|indica|indique|sugere|melhor|custo beneficio|me ajuda|me ajude|ajudar|qual escolher|mais barat[oa] (?:do )?que|menos car[oa] (?:do )?que|como (?:economizar|poupar|irrigar|regar|monitorar|medir|cortar|limpar))\b/.test(text)) return { type: 'recommend', query: text };

  return { type: 'search', query: subject(text.replace(SEARCH_PREFIX, '')) };
}

function stem(word: string): string {
  return word.length > 4 && word.endsWith('s') ? word.slice(0, -1) : word;
}

function similarWord(first: string, second: string): boolean {
  if (Math.min(first.length, second.length) < 5 || Math.abs(first.length - second.length) > 1) return false;
  if (first.length === second.length) {
    const different = [...first].map((character, index) => character === second[index] ? -1 : index).filter((index) => index >= 0);
    return different.length <= 1 || (different.length === 2 && different[1] === different[0] + 1 &&
      first[different[0]] === second[different[1]] && first[different[1]] === second[different[0]]);
  }
  const shorter = first.length < second.length ? first : second;
  const longer = first.length < second.length ? second : first;
  let offset = 0;
  for (let index = 0; index < shorter.length; index++) {
    if (shorter[index] !== longer[index + offset]) {
      if (offset || shorter[index] !== longer[index + 1]) return false;
      offset = 1;
    }
  }
  return true;
}

export function findAssistantProducts(products: ProductModel[], query: string, limit = 4, allowTypos = false): ProductModel[] {
  const alternatives = normalizeAssistantText(query).split(/\s+(?:ou|e)\s+/);
  if (alternatives.length > 1 && alternatives.every((part) => /\b(?:semente|sementes|adubo|adubos|fertilizante|fertilizantes|ferramentas|irrigacao|pecuaria)\b/.test(part))) {
    const unique = new Map(alternatives.flatMap((part) => findAssistantProducts(products, part, limit, allowTypos)).map((product) => [product.id, product]));
    return [...unique.values()].slice(0, limit);
  }
  const words = normalizeAssistantText(query)
    .split(' ')
    .filter((word) => word.length > 1 && !FILLER.has(word))
    .map(stem);
  if (!words.length) return [];

  return products
    .map((product) => {
      const title = normalizeAssistantText(product.title);
      const category = normalizeAssistantText(product.category);
      const description = normalizeAssistantText(`${product.description} ${product.brand ?? ''}`);
      const titleWords = title.split(' ').map(stem);
      const categoryWords = category.split(' ').map(stem);
      const descriptionWords = description.split(' ').map(stem);
      const match = (word: string, candidates: string[]) => candidates.some((candidate) => {
        if (candidate.length < 3 && !/^\d+$/.test(candidate)) return false;
        const synonyms = SYNONYMS.find((group) => group.map(stem).includes(word))?.map(stem) ?? [word];
        return synonyms.some((term) => candidate.startsWith(term) || term.startsWith(candidate) ||
          (allowTypos && similarWord(term, candidate)));
      });
      const matches = words.every((word) => match(word, [...titleWords, ...categoryWords, ...descriptionWords]));
      if (!matches) return { product, score: 0 };

      const score = words.reduce((total, word) =>
        total + (match(word, titleWords) ? 10 : 0)
          + (match(word, categoryWords) ? 4 : 0)
          + (match(word, descriptionWords) ? 1 : 0), 0,
      ) + (title.includes(normalizeAssistantText(query)) ? 30 : 0);
      return { product, score };
    })
    .filter((item) => item.score > 0)
    .sort((first, second) => second.score - first.score || first.product.title.localeCompare(second.product.title, 'pt-BR'))
    .slice(0, limit)
    .map((item) => item.product);
}
