---
tags: [type/diagram, domain/overview, layer/architecture]
aliases: [C4, System Architecture, Arquitetura]
---

# Architecture

> C4 Container diagram of the Cidadao Informa system.

## Container Diagram

```mermaid
C4Container
    title Cidadao Informa — Container View

    Person(citizen, "Cidadão", "Registers and tracks urban issues")
    Person(admin, "Admin Municipal", "Triages and manages protocols")

    System_Boundary(app, "Cidadao Informa") {
        Container(frontend, "React SPA", "React 19 + TypeScript + Vite", "Citizen and admin UI")
        Container(backend, "Spring Boot API", "Java 21 + Spring Boot 3", "Business logic, JWT auth")
        ContainerDb(supabase, "Supabase (PostgreSQL)", "Supabase", "users, protocols tables")
    }

    Rel(citizen, frontend, "Uses", "HTTPS")
    Rel(admin, frontend, "Uses", "HTTPS")
    Rel(frontend, supabase, "Reads/writes directly", "Supabase JS SDK (production path)")
    Rel(frontend, backend, "Calls REST API", "HTTP/JSON (alternative path)")
    Rel(backend, supabase, "Reads/writes via JPA", "JDBC/PostgreSQL")
```

## Two API Paths

The frontend has **two parallel API integration paths**:

| Path | Used For | Notes |
|------|----------|-------|
| `src/services/api.ts` → Supabase JS SDK | Production (Vercel deploy) | Direct DB access, session tokens stored in localStorage |
| `backend-java` Spring Boot API | Academic/local | JWT-signed tokens, Clean Architecture layers |

## Related

- [[Project Overview]]
- [[Tech Stack]]
- [[Data Flow]]
- [[Infrastructure Overview]]
