# Auditoria do site — 28/10/2026

Revisão local do projeto demonstrativo AgroAgrega. As verificações de navegador usaram Chrome em contextos isolados, sem alterar contas ou carrinhos do navegador do usuário. Não houve publicação.

## Correções

- Produto em celular: navegação entre seções e linha de preço/desconto agora quebram corretamente, inclusive em 320 px. Cinco produtos com valores maiores excediam a tela.
- Painel administrativo: inclusão, edição e exclusão persistem no catálogo local; alteração de senha passa a validar e salvar a nova senha; login aceita Enter e mantém a sessão ao recarregar; status dos pedidos e preferências do painel são preservados.
- Tabelas e formulários administrativos passam a respeitar telas pequenas, com rolagem interna onde necessária.
- Checkout: São Paulo incluído nos estados; campos inválidos de cartão deixam de bloquear Pix/boleto após mudar o método; seleção de parcelas e controles de pagamento corrigidos; prevenção de envio repetido e pedido vazio; mensagens de falha visíveis.
- Cartão demonstrativo conclui a compra localmente, sem depender de um túnel externo antigo. Nenhuma cobrança é realizada. Integração externa, se configurada, tem limites de tempo e mensagem de erro preservando o carrinho.
- QR e código de barras usam a biblioteca de renderização existente, mantendo os dados explicitamente demonstrativos.
- Consulta de CEP e edição de endereço atualizam a interface após respostas assíncronas; respostas antigas não substituem um CEP mais recente.
- Login Google indisponível deixa de lançar erro por variável inexistente; a página informa a indisponibilidade e mantém o login por e-mail.
- Perfil apresenta erros de edição; token local suporta nomes com emoji e outros caracteres Unicode.
- Preço do adubo agro-040 unificado no catálogo e detalhes; recomendações do carrinho usam o catálogo atualizado e suas ofertas.
- Formatação monetária em português do Brasil e link de WhatsApp alinhado ao número exibido.
- CSS das ofertas reorganizado para respeitar o orçamento de compilação do componente.

## Verificação realizada

| Área | Cobertura | Resultado |
| --- | --- | --- |
| Testes automatizados | 52 arquivos, 315 testes | Passaram |
| Compilação de produção | `npm run build` | Passou; permanecem avisos de dependências CommonJS |
| Páginas principais | 63 combinações de rota/sessão/largura, em 1440, 390 e 320 px | Sem transbordamento horizontal, imagens quebradas ou erros JavaScript detectados |
| Catálogo completo | 52 páginas de produto, em 320 px, percorrendo conteúdo para carregar imagens | Sem transbordamento, imagens quebradas ou erros JavaScript detectados após as correções |
| Administração | Cinco abas em 1440, 768, 390 e 320 px; login, recarga, CRUD, status e nova senha | Passou |
| Compra completa | Desktop 1440 px e celular 390 px | Cadastro, perfil com emoji, avatar, endereço, frete, pergunta, avaliação, carrinho, cupom, cartão demonstrativo, pedido, PDF, cancelamento, logout e recuperação de senha passaram |
| Ofertas, comparação, cupons e Agro+ | 320, 768 e 1920 px | Abas de ofertas, comparação, filtros, detalhes/aplicação de cupom e ativação/persistência do Agro+ passaram |
| Revisão de alterações | `git diff --check` | Sem erros de whitespace |

As rotas principais incluem início, catálogo, busca vazia, categoria, produto válido/inexistente, cupons, Agro+, carrinho, autenticação, recuperação de senha, sobre, conta, checkout, pedidos e rota desconhecida. Os fluxos de compra também acessam os detalhes de um pedido real criado no teste.

## Limites e configuração

- Frete, pagamentos, assinaturas e autenticação continuam no escopo demonstrativo definido para este projeto. Os testes não comprovam cobrança bancária, cotação de transportadora ou segurança de autenticação de produção.
- Nos testes completos de endereço, a resposta de CEP foi controlada para verificar o preenchimento e a seleção de SP de forma reproduzível. Login OAuth Google, disponibilidade ao vivo de CEP/clima e atendimento externo não foram validados com contas ou serviços reais.
- As preferências de notificação são salvas localmente; não existe envio de e-mail/push implementado por essa alteração.
- Para usar um servidor de pagamento, fornecer `PAYMENT_API_URL` em `app.config.ts`, com o endpoint que atende ao contrato de `PaymentApiService`. Sem esse provider, o checkout permanece demonstrativo. Credenciais privadas devem permanecer no servidor.
- As evidências locais estão em `.local/site-audit/` e os roteiros em `.local/audit-*.cjs` (arquivos de trabalho ignorados pelo Git).

Esta é uma cobertura dos caminhos e tamanhos descritos, não uma garantia de ausência de qualquer falha em todos os navegadores, dados ou serviços externos.
