---
tags: [domain/protocols, layer/database, type/entity]
aliases: [Protocol, Protocolo, Solicitação, protocols table]
---

# Protocol Entity

> JPA entity mapped to the `protocols` table.

## Fields

| Column | Type | Nullable | Notes |
|--------|------|----------|-------|
| `id` | String (UUID) | No | Auto-generated via `@PrePersist` |
| `category` | String | No | Type of urban issue |
| `description` | String | No | Free-text description |
| `address` | String | No | Location of the issue |
| `created_at` | Instant | No | Set by `@PrePersist` |
| `status` | ProtocolStatus | No | Defaults to `Open` |
| `user_id` | String (FK) | No | References [[User Entity]] |
| `requester` | String | No | Denormalized user name |

## Relationships

- Many-to-one with [[User Entity]] via `userId` (lazy fetch)

## Code Reference

`backend-java/src/main/java/br/com/fiap/hackgov/domain/entity/Protocol.java`

## Related

- [[Protocol Domain]]
- [[Protocol Lifecycle]]
- [[Database Schema]]
- [[User Entity]]
