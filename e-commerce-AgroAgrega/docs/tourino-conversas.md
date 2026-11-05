# Conversas do Tourino

O Tourino usa os produtos, preços, avaliações, promoções, cupons e carrinho disponíveis no próprio projeto. A interpretação é local, sem depender de um serviço de IA externo ou de credenciais.

## O que mudou

- Busca por nome, marca, categoria ou necessidade de uso, com sinônimos e tolerância a pequenos erros de digitação.
- Filtros de orçamento e faixa de preço em reais, incluindo formatos como `R$ 1.500,50` e `1,5 mil`.
- Ordenação por preço, avaliação, popularidade e uma combinação de preço e avaliação.
- Memória das opções exibidas e do produto em foco. Dizer “o segundo”, “o mais barato” ou “desse” retoma a conversa; explicar um item não apaga a lista anterior.
- Comparação de até quatro produtos com preço, Pix, parcelamento, avaliação e descrição do catálogo. A numeração permanece consistente ao comparar um subconjunto da lista.
- Escolha por número para ações ambíguas no carrinho. Um pedido como “adicionar 2 sementes” pede a seleção do produto quando há várias opções; “cancelar” descarta a ação pendente.
- Respostas sobre pagamento, frete, devolução e garantia, usando as informações disponíveis na interface.
- Botões de continuação nas respostas, como “Mais baratos”, “Comparar opções” e “Detalhes do primeiro”.
- Refinamento por marca, avaliação mínima e exclusões: “só MultiGrão”, “com nota mínima 4,5” e “sem sementes”. Mantém orçamento e assunto até uma nova busca ou mudança de necessidade.
- “Outras opções” apresenta os próximos produtos sem repetir os já exibidos; os números passam a indicar a lista mais recente. “Sem limite de preço” remove apenas o orçamento, e “recomeçar busca” limpa os filtros.
- “Mais barato que esse” usa o preço do produto em foco; “só dessa marca” usa sua marca.
- “Por que o segundo?” explica a indicação com os critérios da busca e os dados do catálogo.
- Perguntas como “é solar?”, “tem Bluetooth?” ou “qual a potência?” citam título e descrição. Se o cadastro não informa a característica, o Tourino declara a lacuna. Não deduz dosagens ou compatibilidade a partir de dados genéricos.
- Quando precisa perguntar qual produto usar para pagamento, entrega ou características, retoma a pergunta depois da escolha por número ou nome.
- “Desfazer” restaura a última alteração do Tourino em um produto ou cupom. Recusa a restauração se a conta, os itens, a seleção ou o cupom mudaram depois por outro caminho.
- Pedidos em sequência: até três comandos separados por ponto e vírgula, quebra de linha ou “e depois”. A sequência espera uma escolha quando um produto é ambíguo e pode ser interrompida antes da próxima etapa.
- Mensagens de até 1.200 caracteres, com `Shift+Enter` para quebrar a linha. É possível enviar outra pergunta durante a animação ou usar “Mostrar resposta completa”.
- Seleção de até três produtos com orçamento total, uma unidade de cada item e valores do catálogo. O botão para adicionar a seleção confere novamente os preços e as quantidades; “Desfazer” restaura o estado anterior dos itens.
- “Aplique o melhor cupom” aplica o maior desconto disponível aos itens selecionados. Perguntar qual é o melhor cupom continua sendo apenas uma consulta.
- A conversa respeita a rolagem de quem está lendo mensagens anteriores e oferece um botão para voltar à resposta mais recente. Os efeitos visuais respeitam a preferência por movimento reduzido.

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

```text
Buscar insumos até R$ 800
Não quero sementes
Só MultiGrão
Com nota mínima 4,5
Por que o segundo?
Adicionar 2 do segundo
Desfazer
Recomeçar busca
Buscar bomba submersa solar
É solar?
Tem Bluetooth?
```

Também é possível começar com “Me ajude a escolher um produto para irrigar uma horta”, “Buscar sementes e fertilizantes” ou “Buscar roçadera”.

```text
Monte uma seleção de ferramentas até R$ 1000
Buscar irrigação até R$ 800; compare o primeiro com o segundo; quanto ficam 2 do segundo em 3 parcelas?
Adicionar 1 roçadeira; aplique o melhor cupom
```

O agente mantém as quantidades entre 1 e 99 por produto. Uma pesquisa iniciada com “quero” não altera o carrinho; a alteração exige um pedido de adicionar, retirar ou ajustar, ou um clique no controle correspondente. O estoque em tempo real e informações técnicas ausentes do catálogo não são inventados.

O contexto acompanha a navegação entre páginas enquanto o site permanece aberto. Recarregar a página, trocar de conta ou usar “Nova conversa” reinicia a conversa. O carrinho segue as regras de armazenamento do projeto.

## Código e validação

`assistant-intent.ts` interpreta comandos e encontra produtos por palavras e sinônimos. `assistant-catalog.ts` trata filtros, ordenação e referências. `assistant-product-advice.ts` responde perguntas técnicas usando somente os dados cadastrados. `assistant-payment.ts` interpreta quantidades e parcelas, `assistant-workflows.ts` monta seleções por orçamento e `assistant-session.ts` guarda o contexto durante a navegação. `store-assistant.ts` coordena a conversa e executa ações pelos serviços existentes.

```text
npm test -- --watch=false --include=src/app/shared/components/store-assistant/*.spec.ts
```
