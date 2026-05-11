---
tags: [type/diagram, domain/overview]
aliases: [Request Flow, Sequence, Fluxo de Dados]
---

# Data Flow

> End-to-end sequence for the most common user action: opening a new solicitação.

## New Protocol — Sequence Diagram

```mermaid
sequenceDiagram
    actor Citizen
    participant Frontend as React SPA
    participant API as api.ts (Supabase SDK)
    participant Supabase as Supabase PostgreSQL

    Citizen->>Frontend: Fills NewRequest form
    Frontend->>API: api.createProtocol(data)
    API->>Supabase: INSERT INTO protocols
    Supabase-->>API: { id, status: "Aberto", ... }
    API-->>Frontend: protocol object
    Frontend-->>Citizen: Redirect to CitizenProtocols + success toast
```

## Authentication Flow (summary)

See [[Login Flow]] and [[Register Flow]] for detailed sequences.

## Related

- [[Architecture]]
- [[Login Flow]]
- [[Register Flow]]
- [[Protocol Lifecycle]]
- [[API Overview]]
