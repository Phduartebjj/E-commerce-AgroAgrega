export interface AssistantPaymentRequest {
  quantity: number;
  installments: number;
  query: string;
}

/** Quantities are separate from option numbers, package sizes and installment counts. */
export function parseAssistantPaymentRequest(message: string): AssistantPaymentRequest {
  let query = message.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  const numbers: Record<string, number> = { um: 1, uma: 1, dois: 2, duas: 2, tres: 3, quatro: 4, cinco: 5, seis: 6, sete: 7, oito: 8, nove: 9, dez: 10 };
  const amount = '-?\\d+(?:[.,]\\d+)?|um|uma|dois|duas|tres|quatro|cinco|seis|sete|oito|nove|dez';
  let quantity = 1;
  const installments = Number(query.match(/\bem\s+(\d+)\s*(?:x|parcelas?)\b/)?.[1] ?? 10);
  const units = new RegExp(`\\b(${amount})\\s+(unidades?(?:\\s+de)?|itens?(?:\\s+de)?|dess[ea]s?|dest[ea]s?)\\b`);
  const match = query.match(units);
  if (match) {
    // Include the preceding minus, which is outside a word boundary.
    const negative = match.index! > 0 && query[match.index! - 1] === '-';
    quantity = (numbers[match[1]] ?? Number(match[1].replace(',', '.'))) * (negative ? -1 : 1);
    query = query.replace(units, /^d/.test(match[2]) ? match[2] : ' ');
  } else {
    const leading = query.match(new RegExp(`^(quanto (?:custa[m]?|fica[m]?|daria|sai|saem)(?: por)?\\s+)(${amount})\\s+(?!parcelas?\\b|kg\\b|g\\b|ml\\b|l\\b|litros?\\b|cv\\b|v\\b|w\\b|cm\\b|mm\\b|m\\b|doses?\\b)([a-z].*)$`));
    if (leading) {
      quantity = numbers[leading[2]] ?? Number(leading[2].replace(',', '.'));
      query = leading[1] + leading[3];
    }
  }
  query = query
    .replace(/^(?:quanto (?:custa[m]?|fica[m]?|daria|sai|saem|vou pagar)(?: por)?|(?:simule|simular|calcule|calcular)(?: o (?:valor|preco|total)(?: de)?)?)\s*/, '')
    .replace(/\b(?:no pix|por pix|a vista|no cartao|parcelado|parceladas?|em \d+x|em \d+ parcelas?|sem juros)\b/g, ' ')
    .replace(/[?!]/g, '').trim();
  return { quantity, installments, query };
}
