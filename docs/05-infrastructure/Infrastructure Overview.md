---
tags: [type/hub, domain/infra]
aliases: [Infrastructure, Infraestrutura, Infra]
---

# Infrastructure Overview

> Hosting, database, and runtime infrastructure for Cidadao Informa.

## Diagram

```mermaid
flowchart LR
    Browser -- HTTPS --> Vercel
    Vercel -- serves --> SPA[React SPA]
    SPA -- Supabase JS SDK --> Supabase[(Supabase PostgreSQL)]
    SPA -- optional REST --> SpringBoot[Spring Boot API]
    SpringBoot -- JDBC --> Supabase

    subgraph Supabase
        users[(users table)]
        protocols[(protocols table)]
    end
```

## Notes in This Domain

- [[Supabase]]
- [[Database Schema]]
- [[Environment Variables]]
- [[Deploy]]

## Related

- [[Architecture]]
- [[Tech Stack]]
