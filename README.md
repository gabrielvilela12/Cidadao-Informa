# Cidadão Informa

Sistema web de zeladoria pública e acessibilidade urbana desenvolvido para o
projeto HackGov/FIAP.

## Arquitetura

```text
Navegador (React)
        |
        | HTTPS + JWT da aplicação, sempre no domínio da Vercel
        v
Vercel
  |-- /api/*, /swagger  -->  serviço backend (container Java 21)
  `-- demais rotas      -->  frontend Vite compilado
                                  |
                        API Java (Spring Boot)
                                  |
              +-------------------+-------------------+
              | conexão PostgreSQL privada            | server-to-server
              v                                       v
     Supabase PostgreSQL                    Supabase Edge Functions
     (Session Pooler)                       (triagem e imagem por IA)
```

O frontend não acessa o Supabase diretamente e não recebe URL, chave `anon`,
senha do banco ou chave de serviço. A única variável incluída no bundle do
navegador é `VITE_API_URL`, que contém o endereço público da API Java.

A API Java é responsável por:

- cadastro, login e emissão/validação de JWT;
- limite de tentativas de login por IP e por CPF;
- consultas e alterações de usuários e protocolos;
- autorização de cidadãos e administradores;
- cadeia de auditoria encadeada por hash, e sua verificação;
- acionamento das Edge Functions de prioridade e de correção de imagem.

A única exceção ao caminho pelo Java é a geocodificação: as telas de mapa e de
nova solicitação chamam o Nominatim (OpenStreetMap) direto do navegador. Não há
credencial envolvida nessas chamadas.

## Tecnologias

### Frontend

- React 19
- TypeScript
- Vite 6
- Tailwind CSS 4
- Leaflet e react-leaflet
- Recharts
- lucide-react e motion

Duas dependências que o projeto **deixou** de usar, e o que ficou no lugar:

- **Roteador próprio, em `src/lib/router.tsx`.** As telas continuam importando
  `react-router-dom`, mas o pacote não está instalado: `vite.config.ts` e o
  `paths` do `tsconfig.json` apontam esse nome para o arquivo do repositório. Ele
  implementa só o que o projeto usa — `BrowserRouter`, `Routes`, `Route`, `Link`,
  `NavLink`, `Navigate`, `useNavigate`, `useLocation`, `useParams`.
- **Exportação em CSV, não em XLSX.** A dependência `xlsx` foi removida por não
  ter correção publicada para vulnerabilidades conhecidas. O arquivo baixado é
  CSV com BOM UTF-8 e separador `;`, que o Excel em pt-BR abre direto. A função
  segue chamada `exportToExcel` porque é o nome da ação no produto.

### Backend e infraestrutura

- Java 21 e Spring Boot
- Spring Security e JWT (validade de 24 horas)
- Spring Data JPA e HikariCP
- PostgreSQL no Supabase, pela conexão Session Pooler
- Flyway
- springdoc-openapi (Swagger em `/swagger`)
- Supabase Edge Functions (Deno)
- Vercel para frontend e backend

## Configuração

Copie `.env.example` para `.env.local`. O arquivo local é ignorado pelo Git e é
lido tanto pela raiz quanto por `backend-java` — um arquivo atende aos dois
projetos.

```env
VITE_API_URL=http://localhost:5206

SPRING_DATASOURCE_URL=jdbc:postgresql://<session-pooler-host>:5432/postgres?sslmode=require
SPRING_DATASOURCE_USERNAME=postgres.<project-ref>
SPRING_DATASOURCE_PASSWORD=<database-password>
JWT_SECRET=<random-secret-with-at-least-32-characters>
CORS_ALLOWED_ORIGINS=http://localhost:3000

SUPABASE_EDGE_FUNCTION_URL=https://<project-ref>.supabase.co/functions/v1/classify-priority
SUPABASE_ANON_KEY=<supabase-anon-key>
SUPABASE_CORRECTED_IMAGE_FUNCTION_URL=https://<project-ref>.supabase.co/functions/v1/generate-corrected-image
AI_IMAGE_FUNCTION_SECRET=<segredo-compartilhado-com-a-edge-function>
AI_IMAGE_STORAGE_BUCKET=ai-corrections
```

`.env.example` traz ainda as variáveis operacionais, com os mesmos valores que a
API assume por padrão: `SPRING_MAIN_LAZY_INITIALIZATION=false`,
`SPRING_DATA_JPA_REPOSITORIES_BOOTSTRAP_MODE=default`, `SPRING_FLYWAY_ENABLED=true`,
`SPRING_JPA_HIBERNATE_DDL_AUTO=validate`, `APP_SCHEDULING_ENABLED=true` e os três
limites de login (`LOGIN_RATE_LIMIT_*`).

Se `SUPABASE_CORRECTED_IMAGE_FUNCTION_URL` ficar vazia, a API deriva o endereço
trocando `classify-priority` por `generate-corrected-image` na URL da outra
função. `AI_IMAGE_FUNCTION_SECRET` também tem fallback: sem ele, a API usa
`SUPABASE_ANON_KEY`.

Para habilitar a simulação de correção por IA, publique a função
`generate-corrected-image` e configure nela os segredos `OPENROUTER_API_KEY` e
`AI_IMAGE_FUNCTION_SECRET`. Os modelos podem ser trocados pelos segredos
opcionais `OPENROUTER_IMAGE_MODEL` (padrão `google/gemini-3.1-flash-image`) e
`OPENROUTER_REPORT_MODEL` (padrão `google/gemini-3.7-flash`). A leitura da foto e
a criação do plano usam o Gemini 3.7 Flash; a edição visual continua no Nano
Banana 2 (Gemini 3.1 Flash Image), pois o Gemini 3.7 Flash gera apenas saída em
texto. A imagem corrigida é solicitada em JPEG 2K com compressão 70 por padrão.
Quando o resultado cabe em `AI_IMAGE_MAX_DATA_URL_LENGTH` (padrão `4500000`), a
função retorna Base64 como antes. Quando passa desse limite, a própria Edge
Function salva o arquivo no Supabase Storage, no bucket
`AI_IMAGE_STORAGE_BUCKET` (padrão `ai-corrections`), e retorna a URL pública para
o backend gravar no protocolo. O bucket é criado ou ajustado automaticamente como
público na primeira imagem grande, usando as chaves server-side disponíveis para
a Edge Function. Qualquer modelo, resolução ou compressão pode ser sobrescrito
pelas variáveis respectivas.

Use a conexão Session Pooler mostrada no botão `Connect` do projeto para
funcionar também em hospedagens e redes compatíveis apenas com IPv4. Nunca
coloque `SPRING_DATASOURCE_PASSWORD`,
`JWT_SECRET` ou `SUPABASE_ANON_KEY` em variáveis com prefixo `VITE_`.

## Executar localmente

Inicie a API Java:

```bash
cd backend-java
mvn spring-boot:run
```

Em outro terminal, inicie o frontend:

```bash
npm install
npm run dev
```

- Frontend: `http://localhost:3000`
- API: `http://localhost:5206`
- Health: `http://localhost:5206/api/health`
- Swagger: `http://localhost:5206/swagger`

## Testes

```bash
npm test          # roda a suíte uma vez
npm run test:watch
npm run lint      # tsc --noEmit
```

Vitest, sobre a mesma configuração do Vite — sem arquivo de configuração próprio.
Os testes cobrem a lógica pura das telas de mapa: escala do calor, agregação por
estado e cidade, e o status canônico do protocolo. Ficam em `src/__tests__/` e
entram no `tsconfig`, então `npm run lint` também verifica os tipos deles.

Um deles usa a base de demonstração como fixture: quando
`supabase/seed/demo-dados.sql` existe, o teste confere a UF que a geometria deduz
de cada coordenada contra a UF escrita no endereço, nos mais de 500 chamados. Sem
o arquivo, esse bloco é pulado em vez de falhar.

No backend, JUnit 5 com Mockito, sem subir contexto do Spring nem tocar o banco:

```bash
cd backend-java
mvn test
```

Cobrem o cadastro (`RegisterUseCase`), as estatísticas públicas
(`GetPublicStatsUseCase`), a normalização de CPF/identidade (`AuthUtils`) e o
limitador de tentativas de login (`LoginRateLimiter`).

`src/__tests__/integration/aiPriority.checklist.md` é um roteiro de verificação
manual do fluxo de triagem por IA, que depende de backend e Edge Function no ar.

## API

Rotas públicas, sem token:

| Rota | O que faz |
|---|---|
| `POST /api/auth/login` | Emite o JWT. Estourado o limite de falhas, responde `429` com `Retry-After` |
| `POST /api/auth/register` | Cria o cidadão e já devolve o JWT |
| `GET /api/health` | Executa `SELECT 1`; confirma API e banco de uma vez |
| `GET /api/protocols/stats` | Números agregados da landing page |
| `GET /api/protocols/public/{id}` | Consulta pública de um protocolo (tela `/p/:id`) |
| `/swagger`, `/swagger/v3/api-docs` | Documentação OpenAPI |

Rotas autenticadas — o papel é lido do token e reconferido no backend, não na
interface:

| Rota | Quem acessa |
|---|---|
| `GET /api/auth/me` | Qualquer sessão válida |
| `PATCH /api/auth/me/phone` | O próprio usuário |
| `POST /api/protocols` | Cidadão; a criação dispara a triagem de prioridade |
| `GET /api/protocols` | Cidadão vê os próprios; servidor vê somente as UFs permitidas |
| `GET /api/protocols/{id}` | Dono do protocolo ou servidor autorizado para a UF |
| `PATCH /api/protocols/{id}/status` | Servidor autorizado para a UF |
| `POST /api/protocols/{id}/ai-correction` | Admin; simulação de correção por IA |
| `POST /api/protocols/geocode/backfill` | Admin; preenche coordenada faltante |
| `GET /api/protocols/events` | Admin; stream SSE de novas solicitações |
| `GET /api/protocols/{id}/audit` | Dono do protocolo ou admin |
| `GET /api/protocols/audit/verify` | Admin; revalida a cadeia de hashes |
| `GET /api/ai-priority/{protocolId}` | Qualquer sessão válida |
| `POST /api/ai-priority/regenerate/{protocolId}` | Admin |
| `GET /api/ai-priority/logs` | Admin (aba Logs de IA em `/admin/ia`) |
| `GET /api/ai-priority/jobs/failed` | Admin |
| `GET /api/admin/ai-prompts` | Admin; lista os prompts ativos dos agentes de IA |
| `PUT /api/admin/ai-prompts/{agentKey}` | Admin; atualiza e versiona o prompt de um agente |
| `GET /api/admin/citizens` | Admin; cidadãos com contagem de protocolos e disponibilidade de WhatsApp |
| `GET /api/admin/citizens/{id}` | Admin; cadastro do cidadão e histórico completo de protocolos |
| `GET /api/admin/server-permissions` | Admin; lista servidores e suas UFs autorizadas |
| `PUT /api/admin/server-permissions/{userId}` | Admin; substitui as UFs autorizadas do servidor |

O limite de login conta falhas em janela deslizante, por IP e por CPF em
separado, com os padrões 30 falhas por IP, 10 por CPF e janela de 15 minutos. É
memória do processo, não do banco: reiniciar a API zera a contagem.

Jobs de triagem que falharam são reprocessados por uma tarefa agendada a cada 5
minutos, desligável por `APP_SCHEDULING_ENABLED=false`.

## Rotas do frontend

| Rota | Acesso |
|---|---|
| `/` | Landing para visitante; dashboard do cidadão quando autenticado |
| `/login`, `/cadastro` | Público |
| `/termos-de-uso`, `/privacidade`, `/acessibilidade` | Público |
| `/p/:id` | Público — consulta de protocolo por link |
| `/nova-solicitacao`, `/mapa`, `/meus-protocolos` | Cidadão |
| `/perfil`, `/protocolo/:id` | Autenticado |
| `/admin` | Dashboard executivo (admin) |
| `/admin/solicitacoes` | Fila de solicitações (admin) |
| `/admin/cidadaos`, `/admin/cidadaos/:id` | Cidadãos cadastrados e histórico individual (admin) |
| `/admin/permissoes` | Permissões territoriais dos servidores por UF (admin) |
| `/admin/mapa` | Mapa estratégico (admin) |
| `/admin/relatorios` | Relatórios (admin) |
| `/admin/ia` | Prompts dos agentes e logs da triagem por IA (admin) |
| `/admin/ai-logs` | Redirecionamento legado para `/admin/ia` |

Rota de admin acessada por cidadão redireciona para `/`. A verificação vale como
navegação; a autorização de verdade é a do backend.

## Mapa de calor

O Mapa Estratégico (`/admin/mapa`) tem duas camadas, alternadas na barra
superior: **Pins**, um marcador por chamado, e **Calor**, densidade agregada. A
camada de calor tem três leituras da mesma base filtrada:

| Modo | O que mostra | Onde vive |
|---|---|---|
| Calor | Mancha contínua de densidade, azul → vermelho | `components/admin/HeatGradientLayer.tsx` |
| Estado | Perímetro da UF pintado pela contagem | `components/admin/HeatStateLayer.tsx` |
| Cidade | Círculo em volta de onde os chamados estão | `components/admin/HeatCityLayer.tsx` |

Os filtros de tipo e status valem para as duas camadas: dá para ver a
concentração só de "Auditiva + Atrasado".

Três pontos que a leitura do código não entrega de imediato:

- **A escala é relativa à base filtrada.** O gradiente normaliza pela densidade
  do decil mais quente, então a legenda escreve quantos chamados o vermelho
  representa — sem isso, "vermelho" mudaria de significado a cada filtro.
- **Raio em metros, não em pixels.** A mancha cobre a mesma área do chão em
  qualquer zoom. O mesmo vale para o círculo de cidade, que só não encolhe abaixo
  de um piso em pixels para não desaparecer na visão de país.
- **Chamado sem coordenada confirmada fica fora do mapa** e é contado à parte na
  legenda. Um mapa que descarta parte da base em silêncio faz parecer que a
  demanda está onde ela apenas foi geolocalizada.

O contorno das 27 UFs (`src/data/estados-brasil.ts`) é gerado por
`tools/gerar-estados.ts` e carregado por import dinâmico, só quando o modo Estado
é acionado:

```bash
npx tsx tools/gerar-estados.ts
```

## Base de demonstração

Para apresentar o sistema com as telas cheias, `supabase/seed/` tem 554 chamados
fictícios espalhados pelo país, com datas de hoje a mais de um ano atrás e as
quatro prioridades da triagem. Nada ali roda em deploy — veja
`supabase/seed/README.md`.

## Produção

A Vercel publica os dois lados no mesmo projeto e no mesmo domínio: o frontend
Vite e o backend Spring Boot como *container service* (`Dockerfile.vercel`, com
`start-vercel.sh` abrindo a porta pública enquanto a JVM termina de subir). O
`vercel.json` manda `/api/*` e `/swagger` para o serviço backend, e todo o resto
para o frontend. Como é o mesmo domínio, o navegador nunca conhece o endereço
interno do container.

O container ativa o perfil `vercel`: Flyway e a validação de schema do
Hibernate ficam desligados, a documentação OpenAPI não é carregada e a JVM
prioriza startup. Ao abrir a tela pública sem sessão, o frontend também chama
`/api/health` em segundo plano para começar o cold start antes do envio do
login. O ambiente local continua usando as configurações completas de
`application.yml`.

O mapa administrativo mantém um SSE aberto em `/api/protocols/events`. Como a
Vercel pode atender o POST do cidadão e o stream do admin em instâncias
diferentes, instâncias com assinantes consultam no PostgreSQL somente a projeção
leve dos protocolos recentes e deduplicam os ids já enviados. O padrão é uma
consulta por segundo; sem mapa conectado, nenhuma consulta adicional é feita.

Para o frontend, configure:

```env
VITE_API_URL=/
```

No projeto da Vercel, os valores privados vão como variáveis de ambiente
protegidas (Production e Preview): `SPRING_DATASOURCE_URL`,
`SPRING_DATASOURCE_USERNAME`, `SPRING_DATASOURCE_PASSWORD`, `JWT_SECRET`,
`SUPABASE_EDGE_FUNCTION_URL` e `SUPABASE_ANON_KEY` — mais
`SUPABASE_CORRECTED_IMAGE_FUNCTION_URL` e `AI_IMAGE_FUNCTION_SECRET` se a
correção de imagem estiver em uso. Alterar uma variável não muda um deploy já
construído; é preciso publicar de novo.

Na Edge Function `generate-corrected-image`, configure também
`OPENROUTER_API_KEY` e o mesmo `AI_IMAGE_FUNCTION_SECRET`. As opções
`AI_IMAGE_STORAGE_BUCKET`, `AI_IMAGE_MAX_DATA_URL_LENGTH`,
`OPENROUTER_IMAGE_RESOLUTION` e `OPENROUTER_IMAGE_OUTPUT_COMPRESSION` são
opcionais e controlam quando uma imagem corrigida deve ir para o Storage.

Valores públicos ou operacionais:

```env
CORS_ALLOWED_ORIGINS=https://cidadao-informa.vercel.app
LOGIN_RATE_LIMIT_MAX_FAILURES_PER_IP=30
LOGIN_RATE_LIMIT_MAX_FAILURES_PER_CPF=10
LOGIN_RATE_LIMIT_WINDOW_MINUTES=15
PROTOCOL_EVENTS_POLL_MS=1000
```

`CORS_ALLOWED_ORIGINS` deve listar domínios reais: a API recusa subir com `*`.
Com frontend e API no mesmo domínio, o CORS quase não entra em cena pelo
navegador — ele existe para restringir chamada direta de outra origem.

### Alternativa no Fly.io, para o cold start

O container da Vercel escala para zero e a plataforma não expõe como impedir
isso: medido em produção, **16.832 ms** na primeira requisição depois do ocioso
contra **193 ms** nas seguintes. `backend-java/fly.toml` e
`backend-java/Dockerfile.fly` deixam o backend pronto para o Fly.io com
`min_machines_running = 1` e `auto_stop_machines = 'off'`, onde o processo não
hiberna.

Essa rota está preparada, não ativa: hoje o `vercel.json` aponta `/api/*` para o
serviço backend da própria Vercel. Migrar é trocar esses destinos pela URL
pública do Fly. O passo a passo, incluindo a escolha de região pelo host do banco
e a validação antes de virar o tráfego, está em `backend-java/DEPLOY-FLY.md`.

## Banco e migrations

O schema é versionado em dois lugares equivalentes: as migrations Flyway da API,
em `backend-java/src/main/resources/db/migration/` (V1 a V14), e os SQLs
correspondentes em `supabase/migrations/`, para aplicar pelo painel do Supabase.

Localmente, o Flyway roda na inicialização da API
(`SPRING_FLYWAY_ENABLED=true`, com `ddl-auto: validate` — o Hibernate confere o
schema, nunca o altera). O perfil `vercel` usa `SPRING_FLYWAY_ENABLED=false` e
`ddl-auto: none` para não repetir esse trabalho em cada cold start. Portanto,
uma migration nova deve ser aplicada primeiro pelos SQLs em
`supabase/migrations/`; só depois a nova imagem deve ser publicada.

Além do schema base, as migrations cobrem prioridade por IA e seus logs, os prompts
configuráveis dos agentes, a cadeia
de auditoria dos protocolos, coordenadas, imagens, imagens corrigidas por IA,
unicidade de identidade dos usuários e o fechamento de permissões/RLS do schema
`public`.

## Estrutura

```text
src/                    frontend React
src/lib/router.tsx      roteador do projeto, aliasado como react-router-dom
src/__tests__/          testes (Vitest) e checklist manual
src/data/               dados embarcados, gerados (contorno das UFs)
tools/                  geradores de dados embarcados
backend-java/           API Spring Boot, Dockerfiles e fly.toml
supabase/functions/     Edge Functions (Deno)
supabase/migrations/    mesmas migrations, para aplicar pelo painel
supabase/seed/          base de demonstração, aplicada à mão
public/                 arquivos públicos
entrega-fase-4/         documentos da entrega acadêmica da Fase 4
```

Em `supabase/functions/`, `chat-assistant`, `classify-priority` (com
`openrouter-client.ts`) e `generate-corrected-image` são as funções em uso,
chamadas pela API Java. As três consultam `ai_prompts` e mantêm seus textos
embutidos apenas como fallback caso a configuração não possa ser lida.
`app-auth` e `app-protocols` são legado da fase em que o navegador falava com o
Supabase direto: nada no código atual as invoca.

## Documentação

| Arquivo | Assunto |
|---|---|
| `RELATORIO_ARQUITETURA_AMBIENTES.md` | Arquitetura, ambientes, variáveis e diagnóstico |
| `backend-java/DEPLOY-FLY.md` | Passo a passo da migração do backend para o Fly.io |
| `supabase/seed/README.md` | Base de demonstração: aplicar, apresentar e remover |
| `src/__tests__/integration/aiPriority.checklist.md` | Verificação manual da triagem por IA |
| `entrega-fase-4/` | Backlog, evolução e reflexão da entrega da Fase 4 |
