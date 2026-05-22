---
title: AI Priority Classification for Solicitações
date: 2026-05-22
status: approved
---

# AI Priority Classification Design

## Overview

Automatically classify the priority (baixa, média, alta, crítica) of citizen-submitted solicitações (service requests) using Gemini 2.5 Flash LLM via OpenRouter API. Classification happens asynchronously after the citizen submits their request, so the citizen gets their protocol number immediately while the AI processes in the background.

**Key Principle:** Citizens never see the priority. Only admins see it in the triage queue and can manually override or regenerate it.

## Requirements

### Functional Requirements

1. **Automatic Classification**
   - When a citizen creates a solicitação, the system immediately returns a protocol number
   - The system asynchronously sends the solicitação's description + category to Gemini 2.5 Flash
   - LLM classifies into one of four priorities: BAIXA, MÉDIA, ALTA, CRÍTICA
   - Admin dashboard shows the priority within seconds (or displays error state)

2. **Admin Controls**
   - In the solicitação detail page, admin can:
     - Click "Regenerar IA" to re-run classification
     - Click "Trocar" to manually assign priority with optional explanation
   - Manual changes are logged with: who changed it, when, previous value, reason

3. **Error Handling**
   - If classification fails, the solicitação arrives in the triage queue with a 2-word warning badge (e.g., "IA Falhou")
   - Admin can regenerate or manually set priority
   - Failed jobs are retried automatically via pg_cron every 5 minutes (up to 3 attempts total)

4. **Auditing**
   - New "IA Logs" admin page shows all classification attempts, errors, and manual overrides
   - Complete history: who changed priority, when, from/to values, source (IA vs admin)

### Technical Requirements

- **Async Processing:** Job queue pattern with Supabase (Edge Function + pg_cron fallback)
- **Database:** New tables for job tracking and audit logs
- **LLM:** Gemini 2.5 Flash via OpenRouter API
- **Prompt:** Detailed instructions with classification criteria and examples
- **Resilience:** Automatic retries, manual regenerate button, admin override always available

## Architecture

### High-Level Flow

```
Citizen submits solicitação
  ↓
Backend creates protocol row + inserts ai_priority_jobs row (status: pending)
  ↓
Backend returns protocol number to citizen ✅ IMMEDIATELY
  ↓
Backend triggers Supabase Edge Function (HTTP POST, non-blocking)
  ↓
Edge Function runs in parallel:
  - Fetches description + category
  - Calls Gemini 2.5 Flash with detailed prompt
  - Updates protocol with priority (or error status)
  - Logs result to ai_job_logs
  ↓
Admin sees priority in triage queue (within seconds)
  ↓
Fallback: pg_cron runs every 5 min, retries failed jobs
```

### Data Model

#### New Table: `ai_priority_jobs`
```sql
CREATE TABLE ai_priority_jobs (
  id UUID PRIMARY KEY,
  protocol_id UUID NOT NULL REFERENCES protocols(id),
  status TEXT NOT NULL CHECK (status IN ('pending', 'processing', 'success', 'failed')),
  description TEXT NOT NULL,
  category TEXT NOT NULL,
  result_priority TEXT CHECK (result_priority IN ('baixa', 'media', 'alta', 'critica')),
  error_message TEXT,
  attempt_count INT DEFAULT 1,
  created_at TIMESTAMP DEFAULT NOW(),
  processing_started_at TIMESTAMP,
  completed_at TIMESTAMP
);
```

#### New Table: `ai_job_logs` (Audit Trail)
```sql
CREATE TABLE ai_job_logs (
  id UUID PRIMARY KEY,
  protocol_id UUID NOT NULL REFERENCES protocols(id),
  priority TEXT NOT NULL,
  source TEXT NOT NULL CHECK (source IN ('ia', 'admin_manual', 'admin_regenerated')),
  admin_id UUID REFERENCES auth.users(id), -- NULL if source = 'ia'
  previous_priority TEXT,
  reason TEXT, -- Optional explanation from admin
  created_at TIMESTAMP DEFAULT NOW()
);
```

#### Modified Table: `protocols`
Add columns:
```sql
ALTER TABLE protocols ADD COLUMN ai_priority TEXT;
ALTER TABLE protocols ADD COLUMN ai_status TEXT DEFAULT 'pending';
-- ai_status values: 'pending' | 'success' | 'failed'
-- ai_priority values: NULL | 'baixa' | 'media' | 'alta' | 'critica'
```

### Edge Function Implementation

**Trigger:** HTTP POST to Edge Function when solicitação is created

**Endpoint:** `/functions/v1/classify-priority`

**Input:**
```json
{
  "protocol_id": "uuid",
  "description": "string",
  "category": "string"
}
```

**Logic:**
1. Update `ai_priority_jobs` to `processing`
2. Call OpenRouter Gemini 2.5 Flash with structured prompt
3. Parse response (expecting single word: CRÍTICA, ALTA, MÉDIA, or BAIXA)
4. If success:
   - Update `protocols` with `ai_priority` + `ai_status: success`
   - Update `ai_priority_jobs` to `success` with `result_priority`
   - Insert row in `ai_job_logs` with source: `ia`
5. If error:
   - Update `ai_priority_jobs` with `status: failed`, `error_message`, `attempt_count++`
   - Update `protocols` with `ai_status: failed`
   - Insert error entry in `ai_job_logs`

**Error Handling:**
- Timeout: 10 seconds
- Retry logic: Edge Function does NOT retry; pg_cron handles retries
- Rate limiting: OpenRouter may return 429; log and retry via pg_cron

### Fallback: pg_cron Job

**Frequency:** Every 5 minutes

**Query:**
```sql
SELECT * FROM ai_priority_jobs 
WHERE status IN ('pending', 'failed') 
AND attempt_count < 3
AND created_at > NOW() - INTERVAL '24 hours'
ORDER BY created_at ASC
LIMIT 20
```

**For each job:**
1. Call Gemini 2.5 Flash (same prompt as Edge Function)
2. Update `ai_priority_jobs` accordingly
3. If 3 attempts reached, mark as `failed` permanently (admin must manually set priority)

## LLM Prompt

**System/User Prompt (send to Gemini 2.5 Flash):**

```
Você é um classificador de prioridade de solicitações de zeladoria urbana.

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
Categoria: {category}
Descrição: {description}

Responda APENAS com UMA palavra: CRÍTICA, ALTA, MÉDIA ou BAIXA

Não adicione explicações, apenas a prioridade.
```

**Expected Response:**
```
ALTA
```

## User Interface

### Admin Triage Queue (Modified)

Extend existing protocol list table with priority column:

| Protocolo | Categoria | Descrição | Prioridade | Status | Ações |
|-----------|-----------|-----------|-----------|--------|-------|
| #12345 | 🛣️ Buraco | "Buraco grande na..." | 🔴 CRÍTICA | ✅ | ... |
| #12346 | 💡 Iluminação | "Lâmpada queimada..." | ⚠️ IA Falhou | ⚠️ | ... |
| #12347 | 🌳 Poda | "Árvore crescendo..." | 🟠 ALTA | ✅ | ... |

**Priority Badge Colors:**
- 🔴 **CRÍTICA** → Red background
- 🟠 **ALTA** → Orange background
- 🟡 **MÉDIA** → Yellow background
- 🟢 **BAIXA** → Green background
- ⚠️ **IA Falhou** → Gray background with warning icon

### Solicitação Detail Page (Modified)

Add "PRIORIDADE" section:

```
┌────────────────────────────────────┐
│ PRIORIDADE                         │
│ ┌──────────────────────────────┐  │
│ │ 🔴 CRÍTICA                   │  │
│ │ Definida pela IA em 5 seg    │  │
│ │ [Regenerar IA] [Trocar]      │  │
│ └──────────────────────────────┘  │
│                                    │
│ HISTÓRICO DE MUDANÇAS              │
│ • 2026-05-22 14:35 - IA          │
│   classificou CRÍTICA              │
│ • 2026-05-22 14:37 - Admin João  │
│   alterou para ALTA                │
│   Motivo: "falso alarme"           │
└────────────────────────────────────┘
```

#### "Regenerar IA" Button
- Sets `ai_priority_jobs.status = pending`
- Triggers Edge Function again
- Shows loading state
- Updates priority + history on success

#### "Trocar" Button
- Opens modal with radio buttons:
  ```
  ○ CRÍTICA
  ○ ALTA
  ○ MÉDIA
  ○ BAIXA
  
  [Optional] Motivo da mudança:
  [Text field]
  
  [Salvar]
  ```
- On save:
  - Updates `protocols.ai_priority`
  - Inserts row in `ai_job_logs` with source: `admin_manual`
  - Shows updated history

### New Page: Admin → IA Logs

List all AI classification attempts with filters and details:

**Filters:**
- Status: Todos / Sucesso / Erro
- Date: Últimas 24h / 7 dias / 30 dias
- Search by protocol number

**Table:**
| Protocolo | Categoria | Tentativas | Status | Erro | Última Tentativa | Ação |
|-----------|-----------|-----------|--------|------|-----------------|------|
| #12346 | Iluminação | 1 | Falha | Timeout | 14:37 | Regenerar |
| #12348 | Buraco | 2 | Falha | 429 Rate Limit | 15:02 | Regenerar |

**Detail Modal** (click on row):
- Full error message / stack trace
- Description + category sent
- API response (if any)
- Manual regenerate button

## Error Handling

### Edge Function Errors
- **Timeout (10s):** Log error, let pg_cron retry
- **429 (Rate Limit):** Log error, exponential backoff via pg_cron
- **Invalid Response:** Log error, let pg_cron retry
- **Invalid Credentials:** Alert ops, mark job failed permanently

### pg_cron Retries
- Max 3 attempts per job
- If all 3 fail, mark as `failed` permanently
- Admin must manually set priority

### Graceful Degradation
- Solicitação always reaches admin, with or without priority
- Missing priority = "IA Falhou" badge
- Admin can always manually set or regenerate

## Testing Strategy

- Unit: LLM prompt generation, response parsing
- Integration: Edge Function → Gemini 2.5 Flash → Database updates
- E2E: Citizen creates solicitação → Admin sees priority within 10 seconds
- Error cases: Network failure, timeout, invalid response, rate limiting

## Performance

- **Target latency:** Priority visible to admin within 5-10 seconds (95th percentile)
- **Edge Function timeout:** 10 seconds
- **pg_cron frequency:** Every 5 minutes (acceptable for retries)
- **Cost:** ~$0.001 per classification (Gemini 2.5 Flash pricing)

## Future Considerations

- Collect feedback: when admin overrides, log if the LLM was "correct"
- Retrain/fine-tune prompt based on admin corrections
- A/B test different classification criteria
- Real-time classification (if latency needs improve)
