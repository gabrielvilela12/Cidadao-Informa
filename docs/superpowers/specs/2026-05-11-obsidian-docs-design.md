# Obsidian Documentation Design — Cidadao Informa

**Date:** 2026-05-11  
**Status:** Approved  

---

## Goal

Create rich, maximally interconnected Markdown documentation for the Cidadao Informa project, optimized for Obsidian's graph view and AI context ingestion. All notes written in English (with Portuguese domain terms preserved where untranslatable).

---

## Structure

7 top-level folders, ~35 notes total:

```
docs/
├── 00-overview/
│   ├── Project Overview.md
│   ├── Architecture.md
│   ├── Tech Stack.md
│   └── Data Flow.md
├── 01-auth/
│   ├── Auth Domain.md
│   ├── Login Flow.md
│   ├── Register Flow.md
│   ├── JWT Service.md
│   ├── AuthController.md
│   ├── LoginUseCase.md
│   ├── RegisterUseCase.md
│   └── User Entity.md
├── 02-protocols/
│   ├── Protocol Domain.md
│   ├── Protocol Lifecycle.md
│   ├── ProtocolsController.md
│   ├── ProtocolInputDto.md
│   ├── ProtocolOutputDto.md
│   └── Protocol Entity.md
├── 03-admin/
│   ├── Admin Domain.md
│   ├── AdminDashboard.md
│   ├── AdminRequestsQueue.md
│   ├── AdminMap.md
│   └── AdminReports.md
├── 04-citizen/
│   ├── Citizen Domain.md
│   ├── Citizen Journey.md
│   ├── CitizenDashboard.md
│   ├── NewRequest.md
│   ├── CitizenProtocols.md
│   ├── CitizenMap.md
│   └── CitizenServices.md
├── 05-infrastructure/
│   ├── Infrastructure Overview.md
│   ├── Supabase.md
│   ├── Database Schema.md
│   ├── Environment Variables.md
│   └── Deploy.md
└── 06-api/
    ├── API Overview.md
    ├── Auth Endpoints.md
    ├── Protocol Endpoints.md
    └── API Contracts.md
```

---

## Note Template

```markdown
---
tags: [domain/X, layer/Y, type/Z]
aliases: [...]
---

# Title

> One-line purpose statement.

## Responsibility
## Dependencies
## Key Logic / Diagram
## Related
## Code Reference
```

---

## Mermaid Diagrams (11 total)

| Note | Diagram Type |
|------|-------------|
| Architecture.md | C4 Container |
| Data Flow.md | Sequence |
| Login Flow.md | Sequence |
| Register Flow.md | Sequence |
| Protocol Lifecycle.md | State Machine |
| Citizen Journey.md | Flowchart |
| Database Schema.md | ER Diagram |
| API Overview.md | Flowchart |
| Auth Domain.md | Class Diagram |
| Protocol Domain.md | Class Diagram |
| Infrastructure Overview.md | Flowchart |

---

## Tag Taxonomy

- `domain/` — auth, protocols, admin, citizen, infra
- `layer/` — frontend, backend, database, api
- `type/` — hub, flow, entity, usecase, controller, dto, service, component, page, diagram, config

---

## Linking Rules

1. Every note links back to its domain hub
2. Hubs link to all child notes
3. Implementation notes link to their DTOs, entities, and services
4. Frontend pages link to the API endpoints they consume
