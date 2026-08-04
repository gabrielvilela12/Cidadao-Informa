# Migrar o backend para o Fly.io

Objetivo: acabar com o cold start. Na Vercel o backend roda como container
service que escala para zero e não há como desligar isso — o schema oficial do
`vercel.json` não expõe `minInstances`, `scaling` nem `alwaysOn`. Medido em
produção: **16.832 ms** na primeira requisição depois do ocioso contra **193 ms**
nas seguintes. No Fly, `min_machines_running = 1` mantém o processo de pé.

O frontend continua na Vercel. Só o backend muda de casa.

> **Status: preparado, não aplicado.** `fly.toml` e `Dockerfile.fly` estão no
> repositório, mas o `vercel.json` publicado hoje aponta `/api/*` para o serviço
> backend da própria Vercel. Enquanto ele não for alterado (passo 6), a produção
> segue no container da Vercel, com o cold start medido acima.

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

### 6. Apontar o frontend

Este é o passo que efetiva a migração. No `vercel.json`, troque os destinos que
hoje apontam para `{ "service": "backend" }` pela URL pública do Fly, e remova o
serviço `backend` do bloco `services` — sem ele a Vercel para de construir a
imagem Java:

```json
{ "source": "/api/(.*)",     "destination": "https://cidadao-informa-api.fly.dev/api/$1" },
{ "source": "/swagger",      "destination": "https://cidadao-informa-api.fly.dev/swagger" },
{ "source": "/swagger/(.*)", "destination": "https://cidadao-informa-api.fly.dev/swagger/$1" }
```

Antes de publicar a Vercel com essa configuração, valide:

```powershell
curl https://cidadao-informa-api.fly.dev/api/health
curl https://cidadao-informa-api.fly.dev/api/protocols/stats
```

O frontend continua com `VITE_API_URL=/`. Esse arranjo é o mais simples para o
navegador: ele fala com o domínio da Vercel e não precisa chamar o Fly direto.
Ainda assim, deixe `CORS_ALLOWED_ORIGINS=https://cidadao-informa.vercel.app` no
Fly para restringir chamadas diretas.

### 7. Keep-warm

Nada a fazer: o workflow `.github/workflows/keep-warm.yml` já foi removido do
repositório. Ele pingava o backend de fora para disfarçar o cold start — frágil, e
sem efeito quando a plataforma criava uma instância nova.

## Custo

`shared-cpu-1x` com 512 MB rodando 24/7 fica na casca de US$ 5/mês. Como
`auto_stop_machines` está desligado, a máquina não hiberna — é isso que se está
comprando.

## Se algo der errado

O site **não sai do ar** durante nenhum desses passos: enquanto o
`vercel.json` não for alterado, todo o tráfego continua indo para o backend
atual na Vercel. A virada do passo 6 é reversível revertendo um commit.
