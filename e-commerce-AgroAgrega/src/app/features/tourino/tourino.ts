import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { StoreAssistant } from '../../shared/components/store-assistant/store-assistant';
import { StoreAssistantState } from '../../shared/components/store-assistant/store-assistant-state';

@Component({
  selector: 'app-tourino',
  imports: [RouterLink, StoreAssistant],
  providers: [StoreAssistantState],
  templateUrl: './tourino.html',
  styleUrl: './tourino.css',
})
export class Tourino {
  readonly prompts = [
    { title: 'Encontre o produto ideal', text: 'Conte o que você precisa e quanto quer investir.', prompt: 'Quero encontrar produtos' },
    { title: 'Compare antes de escolher', text: 'Veja opções e compare preços e características.', prompt: 'Compare sensores de umidade' },
    { title: 'Aproveite os descontos', text: 'Confira os cupons disponíveis para sua compra.', prompt: 'Ver cupons' },
    { title: 'Organize seu carrinho', text: 'Consulte seus itens e ajuste sua compra na conversa.', prompt: 'Quantos itens no carrinho?' },
  ];

  constructor() {
    inject(StoreAssistantState).show();
  }
}
