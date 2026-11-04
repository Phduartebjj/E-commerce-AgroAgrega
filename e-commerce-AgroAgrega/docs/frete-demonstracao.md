# Simulação de frete do projeto

Na página do produto, “Calcular pelo seu CEP” consulta o endereço e apresenta duas opções demonstrativas: entrega econômica e expressa. Não exige conta ou token de transportadora. A origem configurada é **20211-060**, no Rio de Janeiro.

Os preços e prazos são simulados com uma tabela por região de destino, quantidade, valor do produto e embalagem padrão. Os perfis de embalagem e as tarifas estão em `src/app/shared/utils/shipping-simulation.ts`. Quando o título informa peso em kg, a simulação usa esse peso acrescido de 0,3 kg de embalagem. A interface identifica explicitamente a demonstração.

A consulta de CEP usa [ViaCEP](https://viacep.com.br/) e tenta a [BrasilAPI](https://brasilapi.com.br/docs#tag/CEP) em caso de indisponibilidade. As consultas têm limite de tempo; erros liberam o botão para tentar novamente. Nenhum valor é exibido para CEP inexistente. Editar o CEP, alterar a quantidade ou trocar de produto cancela a consulta anterior e limpa a simulação antiga.

As regras cobrem todos os estados e o Distrito Federal. O valor exibido é uma simulação do projeto, sem contratação de entrega. O checkout existente mantém sua própria regra de frete.
