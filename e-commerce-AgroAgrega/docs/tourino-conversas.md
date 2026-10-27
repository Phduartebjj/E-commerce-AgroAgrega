# Conversas do Tourino

O Tourino usa os produtos, preços, avaliações, promoções, cupons e carrinho disponíveis no próprio projeto. A interpretação é local, sem depender de um serviço de IA externo ou de credenciais.

## O que mudou

- Busca por nome, marca, categoria ou necessidade de uso, com sinônimos e tolerância a pequenos erros de digitação.
- Filtros de orçamento e faixa de preço em reais, incluindo formatos como `R$ 1.500,50` e `1,5 mil`.
- Ordenação por preço, avaliação, popularidade e uma combinação de preço e avaliação.
- Memória das opções exibidas e do produto em foco. Dizer “o segundo”, “o mais barato” ou “desse” retoma a conversa; explicar um item não apaga a lista anterior.
- Comparação de até três produtos com preço, Pix, parcelamento, avaliação e descrição do catálogo.
- Escolha por número para ações ambíguas no carrinho. Um pedido como “adicionar 2 sementes” pede a seleção do produto quando há várias opções; “cancelar” descarta a ação pendente.
- Respostas sobre pagamento, frete, devolução e garantia, usando as informações disponíveis na interface.
- Botões de continuação nas respostas, como “Mais baratos”, “Comparar opções” e “Detalhes do primeiro”.

## Exemplos para testar

```text
Quero irrigação até R$ 800
E até R$ 300?
Compare o primeiro com o segundo
Quanto fica o segundo no Pix?
Adicionar 1 do segundo
Quero 2 desse
Mais 2
Meu carrinho
Qual é o melhor cupom?
```

Também é possível começar com “Me ajude a escolher um produto para irrigar uma horta”, “Buscar sementes e fertilizantes” ou “Buscar roçadera”.

O agente mantém as quantidades entre 1 e 99 por produto. Uma pesquisa iniciada com “quero” não altera o carrinho; a alteração exige um pedido de adicionar, retirar ou ajustar, ou um clique no controle correspondente. O estoque em tempo real e informações técnicas ausentes do catálogo não são inventados.

O contexto dura enquanto a instância do chat estiver aberta na aplicação; recarregar a página reinicia a conversa. O carrinho segue as regras de armazenamento do projeto.

## Código e validação

`assistant-intent.ts` interpreta comandos e encontra produtos por palavras e sinônimos. `assistant-catalog.ts` trata orçamento, ordenação e referências. `store-assistant.ts` coordena a conversa e executa ações pelos serviços existentes.

```text
npm test -- --watch=false --include=src/app/shared/components/store-assistant/assistant-intent.spec.ts --include=src/app/shared/components/store-assistant/assistant-catalog.spec.ts --include=src/app/shared/components/store-assistant/store-assistant.spec.ts
```
