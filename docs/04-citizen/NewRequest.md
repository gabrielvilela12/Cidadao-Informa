---
tags: [domain/citizen, layer/frontend, type/page]
aliases: [Nova Solicitação, New Protocol, /nova-solicitacao]
---

# NewRequest

> Multi-step form for citizens to open a new urban service request.

## Route

`/nova-solicitacao`

## Fields

| Field | Type | Notes |
|-------|------|-------|
| category | Select | Urban issue type (e.g., "Buraco na via", "Iluminação") |
| description | Textarea | Free-text description |
| address | Text | Location of the issue |

On submit calls `api.createProtocol()` → inserts into Supabase `protocols` table directly (production) or calls `POST /api/protocols` (Spring Boot path).

## Code Reference

`src/pages/NewRequest.tsx`

## Related

- [[Citizen Domain]]
- [[Citizen Journey]]
- [[Protocol Domain]]
- [[CreateProtocolUseCase]]
- [[Data Flow]]
