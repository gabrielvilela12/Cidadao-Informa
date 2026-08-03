# Cidadão Informa

Sistema web de zeladoria pública e acessibilidade urbana desenvolvido para o
projeto HackGov/FIAP.

## Arquitetura

```text
Navegador (React)
        |
        | HTTPS + JWT da aplicação
        v
API Java (Spring Boot)
        |
        | conexão PostgreSQL privada
        v
Supabase PostgreSQL
```

O frontend não acessa o Supabase diretamente e não recebe URL, chave `anon`,
senha do banco ou chave de serviço. A única variável incluída no bundle do
navegador é `VITE_API_URL`, que contém o endereço público da API Java.

A API Java é responsável por:

- cadastro, login e emissão/validação de JWT;
- consultas e alterações de usuários e protocolos;
- autorização de cidadãos e administradores;
- histórico de auditoria;
- acionamento da Edge Function de classificação de prioridade.

## Tecnologias

### Frontend

- React 19
- TypeScript
- Vite
- React Router
- Tailwind CSS
- Leaflet
- Recharts
- XLSX

### Backend e infraestrutura

- Java 21 e Spring Boot
- Spring Security e JWT
- Spring Data JPA
- PostgreSQL no Supabase
- Flyway
- Supabase Edge Functions
- Vercel para o frontend

## Configuração

Copie `.env.example` para `.env.local`. O arquivo local é ignorado pelo Git.

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
```

Para habilitar a simulação de correção por IA, publique a função
`generate-corrected-image` e configure nela os segredos `OPENROUTER_API_KEY` e
`AI_IMAGE_FUNCTION_SECRET`. O modelo pode ser alterado pelo segredo opcional
`OPENROUTER_IMAGE_MODEL`; o padrão é `google/gemini-3.1-flash-lite-image`.

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

`src/__tests__/integration/aiPriority.checklist.md` é um roteiro de verificação
manual do fluxo de triagem por IA, que depende de backend e Edge Function no ar.

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

O frontend Vite e a API Spring Boot são publicados no mesmo projeto da Vercel.
A rota `/api/*` é encaminhada ao container Java e as demais rotas ao frontend.

Para o frontend, configure:

```env
VITE_API_URL=/
```

Configure `SPRING_DATASOURCE_URL`, `SPRING_DATASOURCE_USERNAME`,
`SPRING_DATASOURCE_PASSWORD`, `JWT_SECRET`, `CORS_ALLOWED_ORIGINS`,
`SUPABASE_EDGE_FUNCTION_URL` e `SUPABASE_ANON_KEY` como variáveis protegidas
do projeto. Elas são consumidas apenas pela API Java e não são incluídas no
bundle do Vite porque não possuem o prefixo `VITE_`.

No ambiente autoscalável da Vercel, use também:

```env
SPRING_MAIN_LAZY_INITIALIZATION=true
SPRING_DATA_JPA_REPOSITORIES_BOOTSTRAP_MODE=lazy
SPRING_FLYWAY_ENABLED=false
SPRING_JPA_HIBERNATE_DDL_AUTO=none
APP_SCHEDULING_ENABLED=false
```

As migrações Flyway continuam habilitadas por padrão no ambiente local e devem
ser executadas de forma controlada antes de um deploy que alterar o banco.

## Estrutura

```text
src/                 frontend React
src/__tests__/       testes (Vitest) e checklist manual
src/data/            dados embarcados, gerados (contorno das UFs)
tools/               geradores de dados embarcados
backend-java/        API Spring Boot
supabase/functions/  classificação de prioridade
supabase/migrations/ estrutura complementar do banco
supabase/seed/       base de demonstração, aplicada à mão
public/              arquivos públicos
```
