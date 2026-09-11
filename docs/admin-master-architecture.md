# Arquitetura do Admin Master

> Estado da implementação em 11 de setembro de 2026, branch `main`.

## Perfis

| Perfil | Papel no produto | Rota inicial |
| --- | --- | --- |
| `platform_owner` | Dono da plataforma. Analisa prefeituras, define plano e mensalidade, controla assinaturas, pagamentos e créditos globais. | `/backoffice` |
| `establishment_owner` | Diretor ou dono da prefeitura. Controla a operação local, a equipe e a carteira de IA. | `/admin-dono` |
| `admin` | Servidor operacional. Atua na fila, no mapa, nos relatórios e na execução dos protocolos conforme suas permissões. | `/admin` |
| `citizen` | Cidadão. Abre solicitações e acompanha os próprios protocolos. | `/` |

`/admin-master` continua disponível como alias autenticado do painel global. A rota canônica usada na comunicação do produto é `/backoffice`.

## Entradas públicas para prefeituras

| Rota | Função |
| --- | --- |
| `/prefeitura` | Landing institucional exclusiva para órgãos públicos, com faixas de preço indicativas. |
| `/cadastro-prefeitura` | Formulário de solicitação de análise; não permite nem exige escolher um plano. |
| `/login-dono` | Entrada autenticada dos donos da plataforma e das prefeituras. |

As faixas comerciais são apenas referência. O envio do formulário não ativa assinatura, não gera cobrança e grava a solicitação com `plan_code` nulo. Depois da análise e da reunião, o dono da plataforma define o plano e a mensalidade no momento da aprovação.

## Modelo de dados

- `platform_plans`: catálogo de planos ativos que podem ser definidos na aprovação.
- `establishment_applications`: solicitações públicas; `plan_code` é opcional enquanto a análise está pendente.
- `establishments`: white-labels da plataforma, como prefeituras ou órgãos.
- `subscriptions`: plano, mensalidade e vigência vinculados a um estabelecimento aprovado.
- `subscription_payments`: cobranças, pagamentos e solicitações de recarga.
- `regional_campaigns`: cobertura municipal ou estadual responsável pelo roteamento de cidadãos e protocolos.
- `users.establishment_id`: vincula diretor, servidor e cidadão ao estabelecimento.
- `protocols.establishment_id`: vincula cada solicitação ao estabelecimento responsável.
- `ai_credit_wallets`, `ai_credit_transactions` e `ai_usage_records`: saldo, movimentações e consumo de IA por prefeitura.

## Fluxo de aprovação

```text
Prefeitura consulta as faixas públicas
  → envia os dados institucionais sem escolher plano
  → solicitação permanece pendente e sem cobrança
  → equipe analisa o cenário e realiza a reunião
  → responsáveis definem plano e mensalidade
  → platform_owner aprova ou rejeita
  → aprovação cria estabelecimento, assinatura e campanha regional
  → diretor da prefeitura recebe acesso
```

O endpoint de aprovação é:

```http
POST /api/admin-master/applications/{applicationId}/approve
```

Payload comercial obrigatório:

```json
{
  "planCode": "municipal",
  "monthlyAmount": 25000.00
}
```

O backend rejeita plano inexistente ou inativo, mensalidade ausente, valor menor ou igual a zero e valor superior a R$ 10 milhões.

## Regra de acesso

- `platform_owner` enxerga todos os estabelecimentos, solicitações e assinaturas.
- `establishment_owner` enxerga o próprio estabelecimento e também acessa as telas operacionais permitidas.
- `admin` enxerga e opera protocolos do próprio estabelecimento conforme suas permissões.
- `citizen` enxerga apenas os próprios protocolos.
- A autorização é validada no backend; a visibilidade da interface não substitui controle de acesso.

## Contato

O e-mail público da plataforma é [cidadao.informa@outlook.com](mailto:cidadao.informa@outlook.com).

## Reset de desenvolvimento

O script `supabase/seed/reset-admin-master.sql` limpa os dados da aplicação e cria uma base de exemplo. Execute-o somente em ambiente de desenvolvimento.

Contas do seed:

| Perfil | CPF | E-mail | Senha |
| --- | --- | --- | --- |
| Dono da plataforma | `00000000000` | `gabriel@adminmaster.local` | `Gabriel@2026` |
| Admin-dono | `11111111111` | `diretor@ribeirao.local` | `Gabriel@2026` |
| Admin | `22222222222` | `servidor@ribeirao.local` | `Gabriel@2026` |
| Cidadão | `33333333333` | `cidadao@ribeirao.local` | `Gabriel@2026` |
