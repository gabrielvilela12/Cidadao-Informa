# Arquitetura Admin Master

## Perfis

| Perfil | Papel no produto | Rota inicial |
| --- | --- | --- |
| `platform_owner` | Dono da plataforma. Controla white-labels, assinaturas, pagamentos e usuarios globais. | `/admin-master` |
| `establishment_owner` | Admin-dono. Diretor ou dono do estabelecimento/prefeitura. Controla a operacao local e equipe. | `/admin-dono` |
| `admin` | Servidor operacional. Atua na fila, mapa, relatorios e execucao dos protocolos. | `/admin` |
| `citizen` | Cidadao. Abre solicitacoes e acompanha seus proprios protocolos. | `/` |

## Modelo de dados

- `establishments`: white-labels da plataforma, como prefeituras ou orgaos.
- `subscriptions`: assinatura comercial vinculada a um estabelecimento.
- `subscription_payments`: cobranças e pagamentos de cada assinatura.
- `users.establishment_id`: vincula diretor, servidor e cidadao ao estabelecimento.
- `protocols.establishment_id`: vincula cada solicitacao ao estabelecimento responsavel.

## Regra de acesso

- `platform_owner` enxerga todos os estabelecimentos e todas as assinaturas.
- `establishment_owner` enxerga o proprio estabelecimento e tambem acessa as telas operacionais.
- `admin` enxerga e opera protocolos do proprio estabelecimento.
- `citizen` enxerga apenas os proprios protocolos.

## Reset de desenvolvimento

O script `supabase/seed/reset-admin-master.sql` limpa os dados da aplicacao e cria uma base de exemplo.

Contas do seed:

| Perfil | CPF | E-mail | Senha |
| --- | --- | --- | --- |
| Dono da plataforma | `00000000000` | `gabriel@adminmaster.local` | `Gabriel@2026` |
| Admin-dono | `11111111111` | `diretor@ribeirao.local` | `Gabriel@2026` |
| Admin | `22222222222` | `servidor@ribeirao.local` | `Gabriel@2026` |
| Cidadao | `33333333333` | `cidadao@ribeirao.local` | `Gabriel@2026` |
