---
tags: [domain/infra, layer/database, type/diagram]
aliases: [ER Diagram, Schema, Banco de Dados]
---

# Database Schema

> Entity-Relationship diagram for the Supabase PostgreSQL database.

## ER Diagram

```mermaid
erDiagram
    users {
        string id PK
        string full_name
        string email
        string cpf
        string phone
        string role
        string password_hash
        timestamp created_at
    }

    protocols {
        string id PK
        string category
        string description
        string address
        timestamp created_at
        string status
        string user_id FK
        string requester
    }

    users ||--o{ protocols : "opens"
```

## Status Values

See [[Protocol Lifecycle]] for the full state machine. Status is stored as a plain string in the `protocols` table (e.g., `"Open"`, `"InProgress"`, `"Resolved"`, `"Closed"`).

## Related

- [[Infrastructure Overview]]
- [[Supabase]]
- [[User Entity]]
- [[Protocol Entity]]
