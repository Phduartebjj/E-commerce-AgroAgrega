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
    { title: 'Monte uma seleção', text: 'Combine até três produtos dentro de um orçamento total.', prompt: 'Monte uma seleção de ferramentas até R$ 1000' },
    { title: 'Encontre o produto ideal', text: 'Conte o que você precisa e quanto quer investir.', prompt: 'Quero encontrar produtos' },
    { title: 'Pesquise e compare', text: 'Deixe o Tourino organizar as etapas da sua escolha.', prompt: 'Buscar irrigação até R$ 800; compare o primeiro com o segundo' },
    { title: 'Aproveite os descontos', text: 'Veja qual cupom gera mais economia na sua compra.', prompt: 'Qual o melhor cupom para meu carrinho?' },
    { title: 'Planeje sua compra', text: 'Confira o total, os descontos e o valor no Pix.', prompt: 'Quanto fica meu carrinho no Pix?' },
    { title: 'Acompanhe seus pedidos', text: 'Consulte o status registrado na sua conta.', prompt: 'Qual o status dos meus pedidos?' },
  ];

  constructor() {
    inject(StoreAssistantState).show();
  }
}
