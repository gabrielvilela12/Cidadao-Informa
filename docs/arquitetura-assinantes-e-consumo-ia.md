# Arquitetura de assinantes, vínculo municipal e consumo de IA

> Estado da implementação em 11 de setembro de 2026.
> Versão de referência: branch `main`, incluindo o limite de 10 perguntas por hora.

## 1. Objetivo

Este documento descreve a evolução e o funcionamento atual do Cidadão Informa desde a criação dos perfis de dono até a implantação da carteira pré-paga, do faturamento por tokens e das otimizações do chatbot.

A solução atende quatro necessidades principais:

1. separar os dados e acessos de cada prefeitura assinante;
2. permitir que o dono da plataforma gerencie prefeituras, planos e assinaturas;
3. vincular cada cidadão à prefeitura responsável por sua região;
4. medir, cobrar, limitar e apresentar o consumo real do chatbot por prefeitura.

## 2. Visão geral da solução

O sistema funciona como uma plataforma multi-tenant. Cada prefeitura é um `establishment`, e usuários, protocolos, assinaturas, pagamentos, carteira e registros de IA são vinculados ao seu `establishment_id`.

```text
Dono da plataforma
  └── Prefeitura assinante
      ├── Assinatura e pagamentos
      ├── Diretor da prefeitura
      ├── Servidores autorizados
      ├── Cidadãos da região
      ├── Protocolos municipais
      └── Carteira e consumo de IA
```

O chatbot pago nunca é chamado diretamente pelo navegador. A chamada passa pelo backend Java, que identifica o usuário e a prefeitura, valida assinatura, configuração, limites e saldo, registra a cobrança e somente então devolve a resposta.

## 3. Perfis e permissões

| Perfil | Identificador | Escopo | Rota inicial |
| --- | --- | --- | --- |
| Dono da plataforma | `platform_owner` | Todas as prefeituras, solicitações de cadastro, assinaturas, pagamentos e créditos | `/backoffice` |
| Diretor da prefeitura | `establishment_owner` | A própria prefeitura, operação local e carteira de IA | `/admin-dono` |
| Servidor | `admin` | A própria prefeitura e somente as telas que lhe foram concedidas | `/admin` |
| Cidadão | `citizen` | A própria conta, seus protocolos e o chatbot da prefeitura vinculada | `/` |

### 3.1. Regras relevantes

- O dono da plataforma não depende de `establishment_id`, pois possui visão global.
- O diretor sempre opera no `establishment_id` presente em sua identidade autenticada.
- O servidor precisa estar vinculado a uma prefeitura e ter a permissão da tela acessada.
- Para visualizar consumo ou administrar o chatbot, o servidor precisa da permissão `AI`.
- O cidadão não acessa informações financeiras da prefeitura.
- As verificações são feitas no backend; esconder uma opção no frontend não é tratado como controle de segurança.

## 4. Evolução por commits

### 4.1. Fundação de donos, estabelecimentos e cobrança comercial

| Commit | Entrega principal |
| --- | --- |
| `336952e` | Arquitetura multi-tenant, `platform_owner`, `establishment_owner`, estabelecimentos, assinaturas, pagamentos e painéis iniciais |
| `2c98500` | Criação de assinaturas pelo dono da plataforma |
| `59081fc` | Direcionamento de protocolos por campanhas regionais |
| `8f34b81` | Consulta dos protocolos de uma prefeitura no backoffice global |
| `f74113b` | Tela detalhada de estabelecimento, assinatura e pagamentos |

### 4.2. Entrada de prefeituras e portal do dono

| Commit | Entrega principal |
| --- | --- |
| `8d5aca7` | Fluxo público de solicitação de cadastro da prefeitura e aprovação pelo dono da plataforma |
| `3b548a6` | CNPJ obrigatório no cadastro da prefeitura |
| `072e082` | Ajustes nos pontos de entrada de cadastro |
| `3432760` | Escolha explícita entre os portais de login |
| `c55c199` | Contas de demonstração para os diferentes perfis |
| `76ec236` | Landing e acesso próprios para o backoffice do dono |
| `35b0e52`, `3d7b179`, `c3d7c36` | Ajustes de layout, CTA e navegação da landing |

### 4.3. Ajustes de infraestrutura

| Commit | Entrega principal |
| --- | --- |
| `bebec89` | Correção do provedor de mapas |
| `6259da3` | Redução do pool JDBC para adequação ao ambiente de produção da Vercel |

### 4.4. Carteira e evolução do chatbot

| Commit | Entrega principal |
| --- | --- |
| `b4c2e01` | Carteira pré-paga, recargas, reserva de saldo, medição de tokens, cálculo de custo e painel financeiro da IA |
| `4933145` | Vínculo do cidadão à prefeitura e atribuição do consumo à carteira municipal correta |
| `6fda10f` | Cadastro residencial completo, comprovante de residência, ativação do chatbot por prefeitura e cache persistente |
| `d2780da` | Alertas financeiros, previsão de saldo, limites antiabuso, roteamento de modelos e cache adicional do provedor |
| Após `d2780da` | Limite persistente de 10 perguntas por cidadão em uma janela móvel de 60 minutos |

## 5. Onboarding de uma prefeitura

O fluxo de entrada de uma nova prefeitura é:

```text
Prefeitura consulta os planos públicos
  → envia uma solicitação de cadastro com CNPJ
  → dono da plataforma analisa
  → solicitação é aprovada ou rejeitada
  → aprovação cria ou libera o estabelecimento e sua estrutura comercial
  → assinatura e campanha regional tornam a operação elegível
```

### 5.1. Condições operacionais

Para receber novos cidadãos e processar o chatbot, a prefeitura precisa:

- estar com o estabelecimento ativo;
- possuir assinatura com status `active` ou `trial`;
- possuir campanha regional ativa e dentro de seu período de vigência;
- ter o chatbot habilitado para chamadas de IA.

### 5.2. Endpoints públicos e globais

| Método | Endpoint | Uso |
| --- | --- | --- |
| `GET` | `/api/public/platform-plans` | Listar planos disponíveis |
| `POST` | `/api/public/establishment-applications` | Solicitar cadastro de prefeitura |
| `GET` | `/api/admin-master/overview` | Visão global do dono da plataforma |
| `GET` | `/api/admin-master/establishments/{establishmentId}` | Detalhes da prefeitura |
| `POST` | `/api/admin-master/applications/{applicationId}/approve` | Aprovar solicitação |
| `POST` | `/api/admin-master/applications/{applicationId}/reject` | Rejeitar solicitação |

## 6. Cadastro do cidadão e vínculo municipal

O cadastro do cidadão solicita:

- nome, CPF, e-mail e senha;
- UF;
- cidade;
- endereço residencial;
- comprovante de residência.

O comprovante aceita PDF, JPG, PNG ou WebP, com limite de 3 MB. O arquivo é armazenado em `user_residence_proofs`, com acesso direto revogado para os papéis públicos do Supabase.

### 6.1. Resolução da prefeitura responsável

O cadastro procura uma campanha regional ativa seguindo esta ordem:

1. campanha municipal da cidade e UF informadas;
2. campanha estadual da UF, quando não houver campanha municipal correspondente.

Os nomes das cidades são comparados sem diferença de acentos, caixa ou separadores. A campanha encontrada também precisa pertencer a um estabelecimento ativo com assinatura habilitada.

Quando a campanha é encontrada, seu `establishment_id` é gravado no cidadão. Se não existir prefeitura ativa para a região, a conta não é criada.

Essa associação define de qual prefeitura serão:

- os protocolos do cidadão;
- a configuração de disponibilidade do chatbot;
- o cache consultado;
- a carteira debitada;
- os relatórios de consumo.

## 7. Assinatura, mensalidade e créditos de IA

A assinatura comercial e a carteira de IA têm responsabilidades diferentes:

- a assinatura controla a validade do acesso da prefeitura à plataforma;
- a mensalidade fica registrada na assinatura e em seus pagamentos;
- a carteira controla o saldo variável utilizado pelo chatbot;
- as recargas adicionam dinheiro à carteira após confirmação.

Não existe, nesta versão, conversão automática da mensalidade em créditos nem integração automática com Pix, cartão ou boleto.

### 7.1. Processo de recarga

```text
Diretor solicita uma recarga
  → `subscription_payments` recebe um pagamento pendente de finalidade `ai_credit_topup`
  → dono da plataforma confirma o pagamento
  → pagamento muda para `paid`
  → carteira recebe o crédito
  → transação de recarga é registrada
```

O valor mínimo padrão de recarga é R$ 10,00.

O dono da plataforma também pode adicionar crédito manual com uma descrição de ajuste.

### 7.2. Endpoints financeiros

| Método | Endpoint | Quem acessa | Uso |
| --- | --- | --- | --- |
| `GET` | `/api/ai-billing` | Diretor ou servidor com permissão `AI` | Consultar carteira, consumo, transações, recargas e alertas da própria prefeitura |
| `POST` | `/api/ai-billing/top-ups` | Diretor | Solicitar recarga |
| `GET` | `/api/admin-master/establishments/{id}/ai-billing` | Dono da plataforma | Consultar consumo de uma prefeitura |
| `POST` | `/api/admin-master/establishments/{id}/ai-billing/credits` | Dono da plataforma | Adicionar crédito manual |
| `POST` | `/api/admin-master/ai-billing/top-ups/{paymentId}/confirm` | Dono da plataforma | Confirmar recarga pendente |

## 8. Cobrança de uma chamada do chatbot

### 8.1. Fluxo completo

```text
Cidadão autenticado envia uma pergunta
  → backend identifica cidadão e prefeitura
  → verifica se o chatbot municipal está habilitado
  → valida e contabiliza a pergunta no limite móvel de uma hora
  → procura resposta segura no cache municipal
  → se houver cache, devolve sem cobrança
  → valida assinatura ativa
  → aplica limites individuais do cidadão
  → bloqueia e reserva saldo da carteira
  → chama a Edge Function ou o fallback direto da OpenRouter
  → recebe tokens e custo real
  → calcula o valor em reais
  → devolve a diferença da reserva
  → grava uso, transação e saldo final
  → armazena a resposta no cache quando ela for segura
```

### 8.2. Reserva de saldo

Antes da chamada externa, o sistema reserva um valor configurável, cujo padrão é:

```text
AI_CHAT_RESERVATION_BRL=0.10
```

A reserva impede chamadas sem saldo e reduz problemas de concorrência. A carteira é carregada com bloqueio de escrita durante a operação, e também possui controle de versão.

Se a resposta não trouxer dados de uso ou se a chamada falhar, a reserva é revertida. Quando a chamada funciona, a transação pendente é liquidada com o custo real.

### 8.3. Fórmula da cobrança

```text
valor_cobrado_brl = custo_openrouter_usd
                    × cotação_usd_brl
                    × (1 + margem_percentual / 100)
```

Valores padrão:

```text
AI_USD_TO_BRL_RATE=5.50
AI_MARKUP_PERCENT=20.00
```

A cotação e a margem utilizadas ficam gravadas no registro de uso. Dessa forma, uma alteração futura de configuração não modifica o histórico financeiro anterior.

Se o custo real for inferior à reserva, a diferença é devolvida. Se for superior, o sistema pode usar o restante disponível na carteira, sem permitir saldo negativo.

### 8.4. Dados registrados por uso

Cada chamada cobrada registra:

- prefeitura e cidadão responsáveis;
- identificador da transação;
- identificador da geração no provedor;
- funcionalidade e modelo utilizado;
- tokens de prompt;
- tokens de resposta;
- total de tokens;
- tokens de raciocínio;
- tokens em cache informados pelo provedor;
- custo OpenRouter em USD;
- custo de inferência upstream em USD;
- cotação USD/BRL;
- margem percentual;
- valor final cobrado em BRL;
- data e hora.

## 9. Carteira e livro de transações

### 9.1. Carteira

A tabela `ai_credit_wallets` mantém uma carteira por prefeitura:

- `balance_brl`: saldo disponível;
- `total_credited_brl`: total histórico creditado;
- `total_consumed_brl`: total histórico consumido;
- `version`: controle de concorrência;
- datas de criação e atualização.

### 9.2. Transações

A tabela `ai_credit_transactions` registra a movimentação financeira:

- tipo da operação, como uso, recarga ou ajuste;
- status, como `pending`, `completed` ou `reversed`;
- valor movimentado;
- valor reservado;
- saldo após a operação;
- referência externa;
- descrição;
- usuário responsável;
- datas de criação e liquidação.

O registro financeiro é separado do registro técnico de tokens. Isso permite auditar tanto o extrato da carteira quanto os detalhes da geração que causou a cobrança.

## 10. Painéis de consumo

### 10.1. Rotas de interface

| Rota | Público |
| --- | --- |
| `/backoffice` | Dono da plataforma |
| `/backoffice/estabelecimentos/:establishmentId` | Dono da plataforma |
| `/backoffice/estabelecimentos/:establishmentId/ia` | Dono da plataforma |
| `/admin-dono` | Diretor da prefeitura |
| `/admin-dono/ia` | Diretor da prefeitura |
| `/admin/ia` | Servidor com permissão `AI` |
| `/admin/ia/consumo` | Servidor com permissão `AI` |

### 10.2. Informações exibidas

O painel financeiro apresenta:

- saldo disponível;
- total creditado e consumido;
- plano, mensalidade, status e período da assinatura;
- chamadas do mês;
- tokens de prompt, resposta, total e cache;
- custo OpenRouter e custo upstream;
- valor cobrado em reais;
- modelo utilizado em cada chamada;
- extrato de transações;
- solicitações de recarga;
- previsão de duração do saldo;
- limites antiabuso configurados.

## 11. Alertas e previsão de saldo

O saldo atual é comparado a uma referência financeira recente. Quando não existe uma transação positiva utilizável, o total creditado serve de referência.

| Faixa | Nível | Comportamento |
| --- | --- | --- |
| Acima de 30% | `healthy` | Sem alerta |
| 30% ou menos | `low` | Alerta amarelo |
| 10% ou menos | `critical` | Alerta vermelho |
| Saldo igual ou inferior a zero | `empty` | Aviso de interrupção das chamadas pagas |

O alerta aparece na tela de consumo e como badge no menu do diretor ou do servidor autorizado. A interface consulta o estado inicialmente e o atualiza a cada cinco minutos.

A previsão usa:

```text
média diária = consumo cobrado no mês / dias transcorridos do mês
dias restantes = saldo atual / média diária
```

Quando ainda não existe consumo no mês, a duração fica como “Sem consumo”. A estimativa é informativa e não representa garantia de duração.

Os alertas atuais são internos à aplicação. Ainda não há envio por e-mail, WhatsApp, SMS ou push.

## 12. Proteção contra abuso

Os limites são individuais por cidadão. O limite horário conta toda pergunta válida; os demais protegem as chamadas que chegariam ao provedor pago.

| Limite | Padrão |
| --- | ---: |
| Chamadas por minuto | 6 |
| Perguntas por hora | 10 |
| Chamadas por dia | 30 |
| Tokens por dia | 50.000 |
| Chamadas simultâneas | 2 |

Quando um limite é excedido:

- a API retorna HTTP `429 Too Many Requests`;
- nenhuma nova reserva é criada;
- nenhum saldo é descontado;
- o cidadão recebe uma mensagem adequada ao limite atingido.

O dia é calculado no fuso `America/Sao_Paulo`. Reservas pendentes dos últimos cinco minutos são consideradas para o limite de simultaneidade.

O limite horário usa uma janela móvel de 60 minutos e também conta respostas encontradas no cache. O registro persistente e um bloqueio por usuário impedem que requisições simultâneas ultrapassem o limite. Respostas do cache continuam gratuitas e não passam pelos limites específicos do provedor.

## 13. Otimização de modelos

Foram configurados dois modelos:

| Finalidade | Modelo padrão |
| --- | --- |
| Principal | `google/gemini-3.7-flash` |
| Econômico | `google/gemini-2.5-flash-lite` |

Perguntas simples são enviadas primeiro ao modelo econômico. Perguntas mais longas ou com termos que indicam análise detalhada são enviadas primeiro ao modelo principal.

Critérios padrão de pergunta simples:

- até 240 caracteres;
- até 35 palavras;
- ausência de indicadores como comparação, análise, relatório, legislação ou explicação detalhada.

O modelo alternativo é informado como fallback para indisponibilidade do primeiro. Respostas simples usam até 450 tokens de saída; respostas complexas, até 800.

## 14. Cache do chatbot

Existem duas camadas complementares de cache.

### 14.1. Cache persistente por prefeitura

A tabela `ai_chat_cache` armazena respostas por `establishment_id`, com validade padrão de 30 dias.

O serviço procura:

1. correspondência exata da pergunta normalizada;
2. correspondência semântica entre perguntas compatíveis.

Configurações padrão:

- até 200 candidatos por busca;
- similaridade mínima de 0,88 para intenções compatíveis;
- similaridade estrita de 0,94 para intenções diferentes;
- contagem de acertos e data do último uso.

Uma resposta recuperada recebe modelo no formato `cache:<modelo-original>`, não contém `usage` nem `billing` e não altera a carteira.

### 14.2. Cache do provedor

Perguntas genéricas e seguras podem receber cabeçalhos de cache para a OpenRouter, com TTL padrão de 300 segundos.

### 14.3. Dados que não entram no cache

O cache persistente é evitado quando a pergunta contém ou depende de:

- CPF, e-mail ou telefone;
- números específicos;
- protocolo individual;
- histórico anterior do usuário;
- palavras que indiquem contexto pessoal;
- resposta com erro ou sem geração válida.

Isso evita compartilhar conteúdo individual entre cidadãos da mesma prefeitura.

## 15. Controle de disponibilidade do chatbot

Cada estabelecimento possui o campo `chat_enabled`, habilitado por padrão.

| Método | Endpoint | Uso |
| --- | --- | --- |
| `GET` | `/api/admin/ai-chat-settings` | Consultar disponibilidade |
| `PATCH` | `/api/admin/ai-chat-settings` | Ativar ou desativar o chatbot |

O diretor pode alterar essa configuração diretamente. Um servidor também pode alterá-la quando possui a permissão `AI`.

Quando o chatbot está desabilitado, o cidadão não chega à etapa de cache, reserva ou chamada do provedor.

## 16. Endpoint do chatbot

| Método | Endpoint | Regra |
| --- | --- | --- |
| `POST` | `/api/ai/chat` | Exclusivo para cidadão autenticado e vinculado a uma prefeitura |

Respostas relevantes:

| HTTP | Significado |
| --- | --- |
| `200` | Resposta gerada ou encontrada no cache |
| `400` | Cadastro, vínculo, configuração ou payload inválido |
| `402` | Saldo de IA insuficiente |
| `429` | Limite individual excedido |
| `500` | Falha inesperada; uma reserva existente é revertida |

## 17. Principais tabelas

| Tabela | Responsabilidade |
| --- | --- |
| `establishments` | Prefeituras e organizações assinantes |
| `subscriptions` | Plano, mensalidade, status e vigência |
| `subscription_payments` | Mensalidades e solicitações de recarga |
| `regional_campaigns` | Regiões atendidas por cada prefeitura |
| `users` | Usuários, perfis, endereço e vínculo municipal |
| `user_residence_proofs` | Comprovantes de residência dos cidadãos |
| `protocols` | Solicitações urbanas vinculadas à prefeitura |
| `ai_credit_wallets` | Saldo consolidado de IA por prefeitura |
| `ai_credit_transactions` | Livro de movimentações da carteira |
| `ai_usage_records` | Tokens, modelos e custos de cada chamada |
| `ai_chat_cache` | Respostas reaproveitáveis separadas por prefeitura |
| `ai_chat_request_events` | Perguntas contabilizadas para o limite móvel por cidadão |
| `ai_prompts` | Prompts administráveis dos agentes de IA |

## 18. Migrações relacionadas

| Migração | Conteúdo |
| --- | --- |
| `V18__add_platform_owners_and_billing.sql` | Donos, estabelecimentos, assinaturas e pagamentos |
| `V19__add_regional_campaign_routing.sql` | Campanhas regionais |
| `V20__add_prefeitura_onboarding_without_values.sql` | Solicitações públicas de cadastro |
| `V23__add_ai_credit_wallet_and_usage.sql` | Carteira, transações e registros de uso da IA |
| `V24__link_citizens_to_establishments_by_city.sql` | Cidade residencial e vínculo municipal inicial |
| `V25__add_citizen_residence_fields.sql` | Endereço e comprovante de residência |
| `V26__add_chat_controls_and_cache.sql` | Ativação por prefeitura e cache persistente |
| `V27__add_ai_chat_request_events.sql` | Eventos persistentes para o limite de perguntas por hora |

As migrações equivalentes também existem em `supabase/migrations` para controle do ambiente Supabase.

## 19. Variáveis de configuração

```env
AI_CHAT_RESERVATION_BRL=0.10
AI_USD_TO_BRL_RATE=5.50
AI_MARKUP_PERCENT=20.00
AI_MINIMUM_TOP_UP_BRL=10.00

AI_CHAT_PRIMARY_MODEL=google/gemini-3.7-flash
AI_CHAT_ECONOMY_MODEL=google/gemini-2.5-flash-lite
AI_CHAT_RESPONSE_CACHE_TTL_SECONDS=300

AI_CHAT_CACHE_ENABLED=true
AI_CHAT_CACHE_TTL_DAYS=30
AI_CHAT_CACHE_MAX_CANDIDATES=200
AI_CHAT_CACHE_SIMILARITY_THRESHOLD=0.88
AI_CHAT_CACHE_STRICT_SIMILARITY_THRESHOLD=0.94

AI_CHAT_REQUESTS_PER_MINUTE=6
AI_CHAT_REQUESTS_PER_HOUR=10
AI_CHAT_REQUESTS_PER_DAY=30
AI_CHAT_TOKENS_PER_DAY=50000
AI_CHAT_CONCURRENT_REQUESTS=2
```

As chaves dos provedores continuam sendo configuradas apenas no ambiente de execução e não devem ser registradas no repositório.

## 20. Segurança e isolamento

- O JWT carrega usuário, perfil e prefeitura vinculada.
- O backend deriva o escopo da identidade autenticada, não de um `establishment_id` enviado livremente pelo frontend.
- A carteira usa bloqueio de escrita e controle de versão para reduzir cobranças concorrentes incorretas.
- Cada registro de uso mantém sua prefeitura e seu usuário de origem.
- Cache, carteira e relatórios nunca são compartilhados entre prefeituras.
- Apenas o dono da plataforma confirma recargas e adiciona créditos globais.
- Apenas diretor ou servidor com permissão `AI` consulta o painel municipal.
- Comprovantes e cache possuem RLS habilitado e acesso direto público revogado no Supabase.

## 21. Validação realizada

Na entrega do commit `d2780da` foram executadas as seguintes validações:

- 79 testes do backend Java aprovados;
- 115 testes do frontend aprovados;
- verificação TypeScript sem erros;
- build de produção do frontend aprovado;
- Edge Function `chat-assistant` publicada no Supabase;
- migrações de residência e cache aplicadas no banco;
- dashboard de faturamento validado em produção;
- roteamento para o modelo econômico validado em produção;
- cache validado sem geração de novo uso, cobrança ou alteração do saldo;
- endpoint de saúde validado com HTTP 200.

Em uma chamada de validação, o modelo econômico registrou 658 tokens e cobrança de R$ 0,000616. A repetição da pergunta retornou do cache sem alterar a carteira.

## 22. Estado atual e limitações conhecidas

O núcleo de assinatura, carteira, medição e controle de consumo está operacional em produção.

Itens que ainda dependem de novas integrações ou decisões comerciais:

- pagamento automático de mensalidades;
- pagamento automático de recargas por Pix, cartão ou boleto;
- emissão de nota fiscal;
- atualização automática da cotação USD/BRL;
- alertas por WhatsApp, e-mail, SMS ou push;
- pacotes comerciais de tokens ou franquia incluída na mensalidade;
- suspensão automática por inadimplência integrada a um gateway;
- políticas diferentes de limites e margem por plano;
- conciliação financeira e estorno automático pelo provedor de pagamento.

## 23. Fluxo resumido de ponta a ponta

```text
Prefeitura solicita cadastro
  → dono da plataforma aprova
  → assinatura e campanha são ativadas
  → diretor recebe acesso ao portal municipal
  → cidadão informa UF, cidade, endereço e comprovante
  → sistema vincula cidadão à prefeitura responsável
  → cidadão pergunta ao chatbot
  → configuração e cache são verificados
  → assinatura, limites e saldo são validados
  → modelo econômico ou principal é selecionado
  → custo real e tokens são registrados
  → saldo da prefeitura é atualizado
  → diretor e servidores autorizados acompanham o consumo
  → dono da plataforma controla créditos e confirma recargas
```
