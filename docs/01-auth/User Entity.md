---
tags: [domain/auth, layer/database, type/entity]
aliases: [User, Usuário, users table]
---

# User Entity

> JPA entity mapped to the `users` table in Supabase PostgreSQL.

## Fields

| Column | Type | Nullable | Notes |
|--------|------|----------|-------|
| `id` | String (UUID) | No | Auto-generated via `@PrePersist` |
| `full_name` | String | No | Maps to Java field `name` |
| `email` | String | No | Normalized to lowercase on save |
| `cpf` | String | No | 11-digit Brazilian tax ID |
| `phone` | String | Yes | Added for WhatsApp admin contact |
| `role` | String | No | `"citizen"` (default) or `"admin"` |
| `password_hash` | String | No | bcrypt hash |
| `created_at` | Instant | No | Set by `@PrePersist` |

## Relationships

- One-to-many with [[Protocol Entity]] via `userId`

## Code Reference

`backend-java/src/main/java/br/com/fiap/hackgov/domain/entity/User.java`

## Related

- [[Auth Domain]]
- [[Database Schema]]
- [[Supabase]]
- [[Protocol Entity]]
