# Migrar o backend para o Fly.io

Objetivo: acabar com o cold start. Na Vercel o backend roda como container
service que escala para zero e não há como desligar isso — o schema oficial do
`vercel.json` não expõe `minInstances`, `scaling` nem `alwaysOn`. Medido em
produção: **16.832 ms** na primeira requisição depois do ocioso contra **193 ms**
nas seguintes. No Fly, `min_machines_running = 1` mantém o processo de pé.

O frontend continua na Vercel. Só o backend muda de casa.

## Antes de começar: confira a região do banco

Isto importa mais que a proximidade dos usuários, porque cada query é uma ida e
volta até o Postgres. Olhe o host do seu `SPRING_DATASOURCE_URL`:

| Host contém | Use em `primary_region` |
| --- | --- |
| `sa-east-1` | `gru` (São Paulo) |
| `us-east-1` | `iad` (Virginia) |
| `us-west-1` | `sjc` |
| `eu-central-1` | `fra` |

O `fly.toml` está com `gru`. **Se o seu banco estiver em `us-east-1`, troque para
`iad`** — app em São Paulo com banco na Virgínia fica mais lento que hoje.

## Passo a passo

### 1. Instalar o flyctl e entrar

```powershell
iwr https://fly.io/install.ps1 -useb | iex
fly auth signup   # ou: fly auth login
```

### 2. Criar o app (sem deploy ainda)

Rode de dentro de `backend-java/`:

```powershell
fly launch --no-deploy --copy-config --name cidadao-informa-api
```

`--copy-config` faz ele usar o `fly.toml` que já está no repositório. Se ele
perguntar se quer sobrescrever, responda **não**.

### 3. Configurar os segredos

Os mesmos valores que estão hoje nas variáveis de ambiente da Vercel. Nunca
comite isto:

```powershell
fly secrets set `
  SPRING_DATASOURCE_URL="jdbc:postgresql://..." `
  SPRING_DATASOURCE_USERNAME="postgres.xxxx" `
  SPRING_DATASOURCE_PASSWORD="..." `
  JWT_SECRET="..." `
  SUPABASE_EDGE_FUNCTION_URL="https://xxxx.supabase.co/functions/v1/classify-priority" `
  SUPABASE_ANON_KEY="..." `
  CORS_ALLOWED_ORIGINS="https://cidadao-informa.vercel.app"
```

Se usar a função de correção de imagem, inclua também
`SUPABASE_CORRECTED_IMAGE_FUNCTION_URL` e `AI_IMAGE_FUNCTION_SECRET`.

### 4. Subir

```powershell
fly deploy
```

O build é Maven dentro do Docker, então a primeira vez leva alguns minutos.

### 5. Validar antes de apontar o site

```powershell
fly status                     # a máquina deve aparecer como started
fly logs                       # procure "Started HackGovApplication"
curl https://cidadao-informa-api.fly.dev/api/health
curl https://cidadao-informa-api.fly.dev/api/protocols/stats
```

O teste que interessa: rode o `curl` do health **duas vezes com 20 minutos de
intervalo**. Os dois devem responder em centenas de milissegundos. Se o segundo
demorar segundos, o `auto_stop_machines = 'off'` não pegou.

### 6. Só então apontar o frontend

Duas formas. A primeira é melhor porque o navegador continua falando com o
mesmo domínio — sem CORS e sem requisição de preflight:

**Opção A — proxy pela Vercel (recomendada).** No `vercel.json`, troque o
rewrite de `/api/(.*)` para o Fly e remova o `services.backend`:

```json
{ "source": "/api/(.*)", "destination": "https://cidadao-informa-api.fly.dev/api/$1" }
```

`VITE_API_URL` continua `/`. Peça que eu faça essa alteração quando o Fly
estiver validado — ela é o ponto de virada e não deve subir antes.

**Opção B — chamar o Fly direto.** `VITE_API_URL=https://cidadao-informa-api.fly.dev`
nas variáveis da Vercel. Exige que `CORS_ALLOWED_ORIGINS` no Fly liste o domínio
do frontend, e cada chamada paga um preflight.

### 7. Desligar o keep-warm

Com o backend sempre de pé, `.github/workflows/keep-warm.yml` perde a função e
pode ser removido. Ele nunca funcionou por agendamento mesmo: o GitHub não
disparou o cron nenhuma vez, só a execução manual.

## Custo

`shared-cpu-1x` com 512 MB rodando 24/7 fica na casca de US$ 5/mês. Como
`auto_stop_machines` está desligado, a máquina não hiberna — é isso que se está
comprando.

## Se algo der errado

O site **não sai do ar** durante nenhum desses passos: enquanto o
`vercel.json` não for alterado, todo o tráfego continua indo para o backend
atual na Vercel. A virada do passo 6 é reversível revertendo um commit.
