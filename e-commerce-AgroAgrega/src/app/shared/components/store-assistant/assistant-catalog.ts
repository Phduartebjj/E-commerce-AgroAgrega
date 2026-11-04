import { ProductCategory, ProductModel } from '../../../models/product';
import { findAssistantProducts, normalizeAssistantText } from './assistant-intent';

export interface AssistantCatalogRequest {
  query: string;
  category?: ProductCategory;
  minPrice?: number;
  maxPrice?: number;
  sort?: 'cheapest' | 'expensive' | 'rating' | 'popular' | 'value';
  offersOnly?: boolean;
  brands?: string[];
  excludeTerms?: string[];
  excludeBrands?: string[];
  minRating?: number;
  clearBudget?: boolean;
}

const MONEY = '(?:r\\$\\s*)?(\\d+(?:[.,]\\d+)*)(?:\\s*(mil))?(?:\\s*(?:reais|real))?';
const CONTEXT_WORDS = new Set('que serve funciona funcionar pix parcela parcelas parcelamento pagamento cartao boleto frete entrega prazo cep hoje tipo quantos quantas energia escolher'.split(' '));
const STOP_WORDS = new Set(('a as ao aos agora algum alguma alguns algumas ate abaixo acima barato baratos barata baratas baixo boa bom buscar busque busca catalogo caro caros cara caras com como comprar conhecer consegue conseguir custo da das de desse dessa desses dessas deste desta detalhes diferenca dicas dia diga disso do dos e ela ele eles elas em encontrar encontre entre esse essa esses essas esta este eu favor fale fazer gostaria ha indique indica informacoes isso mais me melhor melhores menor menos meu meus minha minhas mostre mostrar muito na nas nao no nos o os opcao opcoes orcamento outra outras outro outros ou para pelo pelos pode podem poderia por preco preciso primeira primeiro produto produtos procure procurar procuro qual quais quanto quero recomenda recomende recomendacao recomendacoes saber segundo segunda seja sem so sobre sugere sugestao sugerir tambem tem tenho terceira terceiro tourino tudo um uma umas uns valor valores ver veja voce voces maximo minimo limite ate ajudar ajuda ajude uso fica fica'.split(' ')));
const FILTER_WORDS = new Set('apenas somente exclusivamente marca marcas loja lojas prefiro preferencia mas exceto excluindo nem'.split(' '));
const BRANDS = [
  { name: 'AgroSense', pattern: /\bagro\s*sense\b/g },
  { name: 'Biomatrix', pattern: /\bbio\s*matrix\b/g },
  { name: 'MultiGrão', pattern: /\bmulti\s*grao\b/g },
  { name: 'SafraMax', pattern: /\bsafra\s*max\b/g },
];

function cleanQuery(text: string): string {
  return normalizeAssistantText(text).split(' ')
    .filter((word) => word && ((word === 'e' || word === 'ou') ||
      (!STOP_WORDS.has(word) && !CONTEXT_WORDS.has(word) && !FILTER_WORDS.has(word))))
    .join(' ').replace(/^(?:e|ou)(?:\s+|$)|\s+(?:e|ou)$/g, '').trim();
}

function extractBrands(text: string): { text: string; brands: string[] } {
  const brands: string[] = [];
  for (const brand of BRANDS) {
    text = text.replace(brand.pattern, () => {
      brands.push(brand.name);
      return ' ';
    });
  }
  return { text, brands: [...new Set(brands)] };
}

function money(value: string, thousands?: string): number {
  const normalized = value.includes(',') ? value.replace(/\./g, '').replace(',', '.')
    : /^\d{1,3}(?:\.\d{3})+$/.test(value) ? value.replace(/\./g, '') : value;
  return Number(normalized) * (thousands ? 1000 : 1);
}

export function parseAssistantCatalogRequest(message: string): AssistantCatalogRequest {
  let text = message.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  const request: AssistantCatalogRequest = { query: '' };
  text = text.replace(/\b(?:sem\s+(?:limite\s+(?:de\s+)?)?(?:preco|orcamento)|sem\s+limite(?:\s+de\s+(?:preco|orcamento))?|(?:remova|retire|limpe|ignore)\s+(?:o\s+)?(?:limite\s+de\s+)?(?:preco|orcamento))\b/g, () => {
    request.clearBudget = true;
    return ' ';
  });
  // Extract ratings before prices: “nota acima de 4,5” is not a minimum price.
  text = text.replace(/\b(?:nota|avaliacao)\s*(?:(?:minima|minimo)(?:\s+de)?|(?:acima|a partir)\s+de|(?:de\s+)?pelo menos)?\s*(\d+(?:[.,]\d+)?)\s*(?:estrelas?|\/\s*5)?/g, (_match, rating: string) => {
    request.minRating = Number(rating.replace(',', '.'));
    return ' ';
  });
  text = text.replace(/\b(?:pelo menos|no minimo)\s+(\d+(?:[.,]\d+)?)\s+estrelas?\b/g, (_match, rating: string) => {
    request.minRating = Number(rating.replace(',', '.'));
    return ' ';
  });
  text = text.replace(/\b(?:sem|exceto|excluindo|nao quero|nao inclua|nao incluir)\s+(.+?)(?=\s+(?:ate|entre|acima de|abaixo de|com|por|so|apenas|(?:e\s+)?(?:sem|exceto|excluindo|nao quero|nao inclua))\b|[,.!?;]|$)/g, (_match, excluded: string) => {
    const extraction = extractBrands(excluded);
    request.excludeBrands = [...new Set([...(request.excludeBrands ?? []), ...extraction.brands])];
    const terms = extraction.text.split(/\s+(?:e|ou|nem)\s+/).map(cleanQuery).filter(Boolean);
    request.excludeTerms = [...new Set([...(request.excludeTerms ?? []), ...terms])];
    return ' ';
  });
  const branded = extractBrands(text);
  text = branded.text;
  if (branded.brands.length) request.brands = branded.brands;
  if (!request.excludeBrands?.length) delete request.excludeBrands;
  if (!request.excludeTerms?.length) delete request.excludeTerms;
  const range = new RegExp(`(?:entre|de)\\s+${MONEY}\\s+(?:e|a|ate)\\s+${MONEY}`, 'i');
  const between = text.match(range);
  if (between) {
    request.minPrice = money(between[1], between[2]);
    request.maxPrice = money(between[3], between[4]);
    text = text.replace(range, ' ');
  }
  const maximum = new RegExp(`(?:ate|no maximo|abaixo de|menos de|orcamento(?: de)?|limite(?: de)?)\\s+${MONEY}`, 'i');
  const max = text.match(maximum);
  if (max) {
    request.maxPrice = money(max[1], max[2]);
    text = text.replace(maximum, ' ');
  }
  const minimum = new RegExp(`(?:acima de|a partir de|mais de|no minimo)\\s+${MONEY}`, 'i');
  const min = text.match(minimum);
  if (min) {
    request.minPrice = money(min[1], min[2]);
    text = text.replace(minimum, ' ');
  }
  if (/mais barat|menor preco|mais em conta|economico/.test(text)) request.sort = 'cheapest';
  else if (/mais car|maior preco/.test(text)) request.sort = 'expensive';
  else if (/melhor(?:es)? (?:avaliad|avaliac)|maior nota/.test(text)) request.sort = 'rating';
  else if (/mais vendido|mais procurado|popular/.test(text)) request.sort = 'popular';
  else if (/custo beneficio/.test(text)) request.sort = 'value';
  if (/\b(?:ofertas?|promocoes?|relampago)\b/.test(text)) request.offersOnly = true;
  text = text.replace(/mais em conta|custo beneficio|melhor(?:es)? (?:avaliad\w*|avaliac\w*)|maior nota|mais vendid\w*|mais procurad\w*|em promocao|ofertas?|promocoes?|relampago/g, ' ');
  text = text.replace(/(?:limpar|cortar|rocar)\s+(?:o\s+)?(?:mato|grama)/g, 'rocadeira')
    .replace(/(?:monitorar|medir)\s+(?:a\s+)?umidade\s+(?:do\s+)?solo/g, 'sensor umidade solo')
    .replace(/(?:economizar|poupar)\s+agua/g, 'gotejamento');
  request.query = cleanQuery(text);
  const categories: ProductCategory[] = ['Agricultura de Precisão', 'Irrigação', 'Pecuária', 'Ferramentas', 'Insumos'];
  const category = categories.find((category) => request.query === normalizeAssistantText(category));
  if (category) request.category = category;
  return request;
}

export function mergeAssistantCatalogRequest(
  previous: AssistantCatalogRequest | undefined,
  next: AssistantCatalogRequest,
  message: string,
): AssistantCatalogRequest {
  const text = normalizeAssistantText(message);
  const reset = /\b(?:nova busca|nova pesquisa|outra busca|outra pesquisa|mudar de assunto|agora (?:quero|preciso|busque|buscar|procuro))\b/.test(text);
  const newCategory = next.category && next.category !== previous?.category;
  const refinement = !next.query || /^(?:e|mas|so|apenas|somente|com|prefiro|sem|exceto|nao quero)\b/.test(text) ||
    (!!next.category && next.category === previous?.category);
  const base = !reset && !newCategory && refinement ? previous : undefined;
  const request = { ...base, ...next };
  request.query = base && next.query && next.query !== base.query
    ? [...new Set(`${base.query} ${next.query}`.split(' '))].join(' ').trim()
    : next.query || base?.query || '';
  if (base?.excludeTerms || next.excludeTerms) {
    request.excludeTerms = [...new Set([...(base?.excludeTerms ?? []), ...(next.excludeTerms ?? [])])];
  }
  if (base?.excludeBrands || next.excludeBrands) {
    request.excludeBrands = [...new Set([...(base?.excludeBrands ?? []), ...(next.excludeBrands ?? [])])]
      .filter((brand) => !next.brands?.includes(brand));
  }
  if (request.brands && next.excludeBrands) {
    request.brands = request.brands.filter((brand) => !next.excludeBrands!.includes(brand));
    if (!request.brands.length) delete request.brands;
  }
  if (next.clearBudget) {
    delete request.minPrice;
    delete request.maxPrice;
  }
  delete request.clearBudget;
  return request;
}

export function searchAssistantCatalog(products: ProductModel[], request: AssistantCatalogRequest): ProductModel[] {
  let results = request.query ? findAssistantProducts(products, request.query, products.length, true) : [...products];
  const excludedIds = new Set((request.excludeTerms ?? []).flatMap((term) =>
    findAssistantProducts(products, term, products.length, true).map((product) => product.id)));
  results = results.filter((product) =>
    (!request.category || product.category === request.category) &&
    (request.minPrice === undefined || product.price >= request.minPrice) &&
    (request.maxPrice === undefined || product.price <= request.maxPrice) &&
    (!request.brands?.length || request.brands.includes(product.brand ?? '')) &&
    !request.excludeBrands?.includes(product.brand ?? '') &&
    !excludedIds.has(product.id) &&
    (request.minRating === undefined || product.rating >= request.minRating) &&
    (!request.offersOnly || product.flashOffer));
  switch (request.sort) {
    case 'cheapest': results.sort((a, b) => a.price - b.price || b.rating - a.rating); break;
    case 'expensive': results.sort((a, b) => b.price - a.price); break;
    case 'rating': results.sort((a, b) => b.rating - a.rating || a.price - b.price); break;
    case 'popular': results.sort((a, b) => (b.weeklySales ?? 0) - (a.weeklySales ?? 0)); break;
    case 'value': results.sort((a, b) => b.rating / Math.log10(b.price + 10) - a.rating / Math.log10(a.price + 10)); break;
  }
  return results;
}

export function resolveAssistantReferences(query: string, products: ProductModel[]): ProductModel[] {
  const text = normalizeAssistantText(query);
  const indexes: number[] = [];
  const ordinals = /\b(primeir[oa]|segund[oa]|terceir[oa]|quart[oa]|ultim[oa]|[1-4])\b/g;
  for (const match of text.matchAll(ordinals)) {
    const word = match[1];
    if (/^[1-4]$/.test(word) && !/^(?:(?:o|a|opcao|produto|item)\s+)?[1-4]$/.test(text) &&
        !/\b(?:compare|comparar|opcao|item)\b/.test(text)) continue;
    indexes.push(/^primeir/.test(word) ? 0 : /^segund/.test(word) ? 1 : /^terceir/.test(word) ? 2
      : /^quart/.test(word) ? 3 : /^ultim/.test(word) ? products.length - 1 : Number(word) - 1);
  }
  if (indexes.length) return [...new Set(indexes)].map((index) => products[index]).filter(Boolean);
  if (/\bmais barat|menor preco\b/.test(text) && products.length) return [[...products].sort((a, b) => a.price - b.price)[0]];
  if (/\bmais car|maior preco\b/.test(text) && products.length) return [[...products].sort((a, b) => b.price - a.price)[0]];
  return [];
}

export function hasAssistantReference(query: string): boolean {
  const text = normalizeAssistantText(query);
  return /\b(?:primeir[oa]|segund[oa]|terceir[oa]|quart[oa]|ultim[oa]|ess[ea]s?|dess[ea]s?|del[ea]s?|el[ea]s?|atual|desses|dessas|mais barato|mais caro)\b/.test(text) || /^(?:(?:o|a|opcao|produto|item)\s+)?[1-4]$/.test(text);
}
