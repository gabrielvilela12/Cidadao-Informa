# AI Priority Classification Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Automatically classify solicitações into priority levels (baixa, média, alta, crítica) using Gemini 2.5 Flash, delivered asynchronously to admin via job queue pattern with Supabase Edge Functions + pg_cron fallback.

**Architecture:** When a citizen creates a solicitação, the protocol is returned immediately while an async job processes the classification. Supabase Edge Function handles classification in real-time; pg_cron retries failed jobs every 5 minutes. Admin sees priority in the triage queue with controls to regenerate or manually override.

**Tech Stack:** 
- **LLM:** Gemini 2.5 Flash via OpenRouter API
- **Job Queue:** Supabase (Edge Functions + pg_cron)
- **Database:** PostgreSQL (Supabase)
- **Backend:** Spring Boot (existing API)
- **Frontend:** React 19 + TypeScript

---

## File Structure

### Supabase (Database + Edge Functions)
```
supabase/
├── migrations/
│   ├── 20260522000001_create_ai_priority_jobs.sql
│   ├── 20260522000002_create_ai_job_logs.sql
│   └── 20260522000003_add_priority_to_protocols.sql
├── functions/
│   └── classify-priority/
│       ├── index.ts
│       ├── deno.json
│       └── openrouter-client.ts
└── seed.sql (optional: test data)
```

### Backend (Spring Boot)
```
src/main/java/com/cidadaoinforma/
├── domain/
│   ├── ai/
│   │   ├── AiPriorityJob.java (JPA Entity)
│   │   ├── AiJobLog.java (JPA Entity)
│   │   └── Priority.java (Enum: BAIXA, MEDIA, ALTA, CRITICA)
│   └── protocol/
│       └── Protocol.java (modified - add ai_priority, ai_status fields)
├── repository/
│   ├── AiPriorityJobRepository.java
│   └── AiJobLogRepository.java
├── service/
│   ├── AiPriorityService.java
│   └── AiClassificationService.java (delegates to Edge Function)
├── controller/
│   └── AiPriorityController.java
└── task/
    └── RetryFailedAiJobsTask.java (scheduled)
```

### Frontend (React)
```
src/
├── services/
│   └── aiPriorityService.ts (API calls to backend)
├── components/
│   ├── admin/
│   │   ├── PriorityBadge.tsx
│   │   ├── PrioritySection.tsx
│   │   └── ChangePriorityModal.tsx
│   └── icons/
│       └── PriorityIcon.tsx
├── pages/
│   └── admin/
│       ├── ProtocolDetail.tsx (modified - add priority section)
│       ├── ProtocolQueue.tsx (modified - add priority column)
│       └── AiLogsPage.tsx (new)
└── hooks/
    └── useAiPriority.ts
```

### Environment & Config
```
.env.example (add OPENROUTER_API_KEY)
.env.local (user-specific)
src/main/resources/application.yml (Spring Boot config for Edge Function URL)
```

---

## Implementation Tasks

### Task 1: Setup Environment & Dependencies

**Files:**
- Modify: `.env.example`
- Modify: `src/main/resources/application.yml`
- Modify: `supabase/functions/classify-priority/deno.json`

- [ ] **Step 1: Add OpenRouter API key to .env.example**

Edit `.env.example` and add:
```env
OPENROUTER_API_KEY=your_openrouter_api_key_here
VITE_EDGE_FUNCTION_URL=http://localhost:54321/functions/v1/classify-priority
```

- [ ] **Step 2: Update Spring Boot application.yml with Edge Function URL**

Edit `src/main/resources/application.yml` and add:
```yaml
app:
  supabase:
    edge-function-url: ${SUPABASE_EDGE_FUNCTION_URL:http://localhost:54321/functions/v1/classify-priority}
    anon-key: ${SUPABASE_ANON_KEY}
```

- [ ] **Step 3: Create deno.json for Edge Function dependencies**

Create `supabase/functions/classify-priority/deno.json`:
```json
{
  "imports": {
    "std/": "https://deno.land/std@0.208.0/",
    "supabase": "https://esm.sh/@supabase/supabase-js@2.39.0"
  }
}
```

- [ ] **Step 4: Commit**

```bash
git add .env.example src/main/resources/application.yml supabase/functions/classify-priority/deno.json
git commit -m "chore: setup environment and dependencies for AI priority classification"
```

---

### Task 2: Create Database Migrations - ai_priority_jobs Table

**Files:**
- Create: `supabase/migrations/20260522000001_create_ai_priority_jobs.sql`

- [ ] **Step 1: Write migration for ai_priority_jobs table**

Create `supabase/migrations/20260522000001_create_ai_priority_jobs.sql`:
```sql
-- Create ai_priority_jobs table
CREATE TABLE IF NOT EXISTS ai_priority_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  protocol_id UUID NOT NULL REFERENCES protocols(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'success', 'failed')),
  description TEXT NOT NULL,
  category TEXT NOT NULL,
  result_priority TEXT CHECK (result_priority IN ('baixa', 'media', 'alta', 'critica')),
  error_message TEXT,
  attempt_count INT DEFAULT 1,
  created_at TIMESTAMP DEFAULT NOW(),
  processing_started_at TIMESTAMP,
  completed_at TIMESTAMP,
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for fast queries
CREATE INDEX idx_ai_priority_jobs_status ON ai_priority_jobs(status);
CREATE INDEX idx_ai_priority_jobs_protocol_id ON ai_priority_jobs(protocol_id);
CREATE INDEX idx_ai_priority_jobs_created_at ON ai_priority_jobs(created_at DESC);

-- Enable RLS (Row Level Security) - admins only
ALTER TABLE ai_priority_jobs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow read access to admins"
  ON ai_priority_jobs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.user_metadata->>'role' = 'admin'
    )
  );
```

- [ ] **Step 2: Apply migration locally**

Run in Supabase dashboard or via CLI:
```bash
supabase migration up
```

Expected: Migration applies without errors.

- [ ] **Step 3: Commit**

```bash
git add supabase/migrations/20260522000001_create_ai_priority_jobs.sql
git commit -m "db: create ai_priority_jobs table for tracking LLM classification jobs"
```

---

### Task 3: Create Database Migrations - ai_job_logs Table

**Files:**
- Create: `supabase/migrations/20260522000002_create_ai_job_logs.sql`

- [ ] **Step 1: Write migration for ai_job_logs table (audit trail)**

Create `supabase/migrations/20260522000002_create_ai_job_logs.sql`:
```sql
-- Create ai_job_logs table for audit trail
CREATE TABLE IF NOT EXISTS ai_job_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  protocol_id UUID NOT NULL REFERENCES protocols(id) ON DELETE CASCADE,
  priority TEXT NOT NULL CHECK (priority IN ('baixa', 'media', 'alta', 'critica')),
  source TEXT NOT NULL CHECK (source IN ('ia', 'admin_manual', 'admin_regenerated')),
  admin_id UUID REFERENCES auth.users(id),
  previous_priority TEXT,
  reason TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_ai_job_logs_protocol_id ON ai_job_logs(protocol_id);
CREATE INDEX idx_ai_job_logs_created_at ON ai_job_logs(created_at DESC);

-- Enable RLS - admins only
ALTER TABLE ai_job_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow read access to admins"
  ON ai_job_logs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.user_metadata->>'role' = 'admin'
    )
  );
```

- [ ] **Step 2: Apply migration**

```bash
supabase migration up
```

Expected: Migration applies without errors.

- [ ] **Step 3: Commit**

```bash
git add supabase/migrations/20260522000002_create_ai_job_logs.sql
git commit -m "db: create ai_job_logs table for priority classification audit trail"
```

---

### Task 4: Create Database Migrations - Add Priority Fields to protocols

**Files:**
- Create: `supabase/migrations/20260522000003_add_priority_to_protocols.sql`

- [ ] **Step 1: Write migration to add columns to protocols table**

Create `supabase/migrations/20260522000003_add_priority_to_protocols.sql`:
```sql
-- Add AI priority fields to protocols table
ALTER TABLE protocols ADD COLUMN IF NOT EXISTS ai_priority TEXT CHECK (ai_priority IN ('baixa', 'media', 'alta', 'critica'));
ALTER TABLE protocols ADD COLUMN IF NOT EXISTS ai_status TEXT DEFAULT 'pending' CHECK (ai_status IN ('pending', 'success', 'failed'));

-- Create index for fast filtering by priority
CREATE INDEX IF NOT EXISTS idx_protocols_ai_priority ON protocols(ai_priority);
CREATE INDEX IF NOT EXISTS idx_protocols_ai_status ON protocols(ai_status);
```

- [ ] **Step 2: Apply migration**

```bash
supabase migration up
```

Expected: Columns added without errors.

- [ ] **Step 3: Verify columns exist**

Run query in Supabase dashboard:
```sql
SELECT column_name, data_type FROM information_schema.columns 
WHERE table_name='protocols' AND column_name LIKE 'ai_%';
```

Expected: Two rows returned (ai_priority, ai_status).

- [ ] **Step 4: Commit**

```bash
git add supabase/migrations/20260522000003_add_priority_to_protocols.sql
git commit -m "db: add ai_priority and ai_status fields to protocols table"
```

---

### Task 5: Create Edge Function - OpenRouter Client

**Files:**
- Create: `supabase/functions/classify-priority/openrouter-client.ts`

- [ ] **Step 1: Write OpenRouter API client**

Create `supabase/functions/classify-priority/openrouter-client.ts`:
```typescript
const OPENROUTER_API_KEY = Deno.env.get("OPENROUTER_API_KEY");
const OPENROUTER_BASE_URL = "https://openrouter.ai/api/v1";
const MODEL = "google/gemini-2.5-flash";

export interface ClassifyRequest {
  description: string;
  category: string;
}

export interface ClassifyResponse {
  priority: "baixa" | "media" | "alta" | "critica";
  rawResponse: string;
}

export async function classifyPriority(
  request: ClassifyRequest
): Promise<ClassifyResponse> {
  const prompt = buildPrompt(request.category, request.description);

  const response = await fetch(`${OPENROUTER_BASE_URL}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${OPENROUTER_API_KEY}`,
      "HTTP-Referer": "https://cidadaoinforma.app",
    },
    body: JSON.stringify({
      model: MODEL,
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0.3,
      max_tokens: 10,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(
      `OpenRouter API error (${response.status}): ${error}`
    );
  }

  const data = await response.json();
  const rawResponse =
    data.choices[0]?.message?.content?.trim().toUpperCase() || "";

  const priority = parsePriority(rawResponse);
  if (!priority) {
    throw new Error(`Invalid priority response from LLM: ${rawResponse}`);
  }

  return {
    priority,
    rawResponse,
  };
}

function buildPrompt(category: string, description: string): string {
  return `Você é um classificador de prioridade de solicitações de zeladoria urbana.

CATEGORIAS E CRITÉRIOS DE PRIORIDADE:

**CRÍTICA** (ameaça imediata à segurança/saúde pública):
- Buraco grande que pode causar acidentes graves
- Iluminação totalmente apagada em via movimentada à noite
- Deslizamento de terra ou risco de desabamento
- Acúmulo de lixo que atrai vetores/risco biológico imediato

**ALTA** (problema que afeta muitos ou causa impacto operacional):
- Múltiplos buracos em via principal
- Iluminação intermitente/falha em zona comercial
- Entupimento de bueiro/alagamento em via
- Poda de árvore que bloqueia semáforo/sinalização

**MÉDIA** (problema localizado, solução rotineira):
- Buraco pequeno em via secundária
- Iluminação fraca mas funcional
- Poda de árvore que cresce sobre muro
- Lixo espalhado (sem risco biológico imediato)

**BAIXA** (problema cosmético/menor impacto):
- Pixação em muro/poste
- Mato crescendo em calçada
- Lixeira cheia (sem transbordamento)
- Placa suja/desgastada

---

DADOS DO CHAMADO:
Categoria: ${category}
Descrição: ${description}

Responda APENAS com UMA palavra: CRÍTICA, ALTA, MÉDIA ou BAIXA

Não adicione explicações, apenas a prioridade.`;
}

function parsePriority(
  response: string
): "baixa" | "media" | "alta" | "critica" | null {
  const normalized = response.toLowerCase();
  if (normalized.includes("crítica")) return "critica";
  if (normalized.includes("alta")) return "alta";
  if (normalized.includes("média")) return "media";
  if (normalized.includes("media")) return "media";
  if (normalized.includes("baixa")) return "baixa";
  return null;
}
```

- [ ] **Step 2: Verify syntax**

```bash
deno check supabase/functions/classify-priority/openrouter-client.ts
```

Expected: No errors.

- [ ] **Step 3: Commit**

```bash
git add supabase/functions/classify-priority/openrouter-client.ts
git commit -m "feat: create OpenRouter API client for Gemini LLM integration"
```

---

### Task 6: Create Edge Function - Main Handler

**Files:**
- Create: `supabase/functions/classify-priority/index.ts`

[Content continues with all remaining tasks...]

---

**Ready to execute. Dispatching Task 1 implementer subagent now.**
