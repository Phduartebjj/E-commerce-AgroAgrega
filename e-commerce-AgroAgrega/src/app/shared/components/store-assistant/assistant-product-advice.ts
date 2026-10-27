import { ProductModel } from '../../../models/product';

interface ProductFeature {
  label: string;
  question: RegExp;
  evidence: RegExp;
}

// Evidence comes only from the product title and description, never from reviews.
const FEATURES: ProductFeature[] = [
  { label: 'Alimentação elétrica', question: /\beletric[oa]s?\b/, evidence: /\beletric[oa]s?\b/ },
  { label: 'Alimentação solar', question: /\bsolar(?:es)?\b/, evidence: /\bsolar(?:es)?\b/ },
  { label: 'Bateria', question: /\bbaterias?\b/, evidence: /\bbaterias?\b/ },
  { label: 'Gasolina', question: /\bgasolina\b/, evidence: /\bgasolina\b/ },
  { label: 'Bluetooth', question: /\bbluetooth\b/, evidence: /\bbluetooth\b/ },
  { label: 'Wi-Fi', question: /\bwi[\s-]?fi\b/, evidence: /\bwi[\s-]?fi\b/ },
  { label: 'Tensão', question: /\b(?:voltagem|tensao|volts?|bivolt)\b/, evidence: /\b(?:\d+(?:[.,]\d+)?\s*v(?:olts?)?|bivolt)\b/ },
  { label: 'Potência', question: /\b(?:potencia|watts?|cv|hp)\b/, evidence: /\b\d+(?:[.,]\d+)?\s*(?:k?w|watts?|cv|hp)\b/ },
  { label: 'Capacidade', question: /\b(?:capacidade|litros?|mililitros?)\b/, evidence: /\b\d+(?:[.,]\d+)?\s*(?:ml|l|litros?|mililitros?|plantas|unidades)\b/ },
  { label: 'Peso informado', question: /\b(?:peso|pesa|pesam|quilos?|quilogramas?)\b/, evidence: /\b\d+(?:[.,]\d+)?\s*(?:kg|g|quilos?|quilogramas?|gramas?)\b/ },
  { label: 'Medidas informadas', question: /\b(?:dimensoes|medidas|comprimento|altura|largura|tamanho)\b/, evidence: /\b\d+(?:[.,]\d+)?\s*(?:mm|cm|m|polegadas?)\b/ },
  { label: 'Alcance informado', question: /\balcance\b/, evidence: /\b\d+(?:[.,]\d+)?\s*km\b/ },
];

const DOSAGE_QUESTION = /\b(?:dosagem|doses?|hectares?|por ha|quanto (?:usar|aplicar)|quantidade (?:de aplicacao|por))\b/;
const COMPATIBILITY_QUESTION = /\b(?:compativel|compativeis|compatibilidade|misturar|mistura com|funciona com (?:meu|minha)|serve (?:no|na|com)|posso usar (?:em|no|na))\b/;

function normalized(value: string): string {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
}

export function isAssistantFeatureQuestion(query: string): boolean {
  const text = normalized(query).replace(/[?!.,]/g, '').replace(/\s+/g, ' ').trim();
  if (/^(?:buscar?|busque|procuro|procure|quero|mostre|recomende|indique)\b/.test(text)) return false;
  if (DOSAGE_QUESTION.test(text) || COMPATIBILITY_QUESTION.test(text)) return true;
  if (/\b(?:voltagem|tensao|potencia|capacidade|peso|pesa|pesam|dimensoes|comprimento|altura|largura|alcance)\b/.test(text)) return true;
  const subjectless = text.replace(/^(?:(?:o|a)\s+)?(?:primeir[oa]|segund[oa]|terceir[oa]|quart[oa]|ultim[oa]|esse|essa|ele|ela|produto)(?:\s+produto)?\s+/, '');
  return /^(?:e|funciona|opera|trabalha|vem|possui|tem|usa)\s+(?:(?:com|a|de|em|por|o|uma?|energia|alimentacao|conexao|motor)\s+)*(?:eletric[oa]|solar|baterias?|gasolina|bluetooth|wi[\s-]?fi|bivolt)\b/.test(subjectless) ||
    /^quantos?\s+(?:litros?|quilos?|watts?|volts?)\b/.test(subjectless);
}

export function answerAssistantFeatureQuestion(product: ProductModel, query: string): string {
  const question = normalized(query);
  if (DOSAGE_QUESTION.test(question)) {
    return `Os dados de ${product.title} não bastam para definir uma dose de aplicação ou quantidade por hectare. O tamanho da embalagem não determina a dosagem. Confira o rótulo e a ficha técnica com a loja e um profissional habilitado, considerando a cultura e as condições de uso.`;
  }
  if (COMPATIBILITY_QUESTION.test(question)) {
    return `Não há dados suficientes no cadastro de ${product.title} para confirmar essa compatibilidade ou mistura. Confirme na ficha técnica e com a loja os modelos, conexões ou condições de aplicação envolvidos. A descrição disponível é: “${product.description}”`;
  }

  const requested = FEATURES.filter((feature) => feature.question.test(question));
  const snippets = [product.title, ...product.description.split(/(?<=[.!?])\s+/)].filter(Boolean);
  if (!requested.length) {
    return `Essa característica de ${product.title} não está detalhada no cadastro. Confira a ficha técnica com a loja. A descrição disponível é: “${product.description}”`;
  }

  const answers = requested.map((feature) => {
    const evidence = snippets.find((snippet) => feature.evidence.test(normalized(snippet)));
    return evidence
      ? `${feature.label}: o catálogo informa “${evidence}”.`
      : `${feature.label}: não está informada no cadastro; confirme na ficha técnica com a loja.`;
  });
  return `${product.title}\n${answers.join('\n')}`;
}
