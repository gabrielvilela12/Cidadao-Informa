---
tags: [domain/infra, layer/database, type/service]
aliases: [Supabase, Database, PostgreSQL]
---

# Supabase

> Hosted PostgreSQL backend used as the primary data store. Accessed via the Supabase JS SDK from the frontend.

## Client Initialization

```typescript
// src/services/supabase.ts
export const supabase: SupabaseClient = createClient(
    process.env.VITE_SUPABASE_URL,
    process.env.VITE_SUPABASE_ANON_KEY
)
```

A hardcoded fallback URL/key is used in dev if env vars are missing (with a `console.warn`).

## Tables

- `users` → [[User Entity]]
- `protocols` → [[Protocol Entity]]

## Access Pattern

The frontend uses the **anonymous key** (RLS-controlled). The Spring Boot backend connects via JDBC using credentials from environment variables.

## Related

- [[Infrastructure Overview]]
- [[Database Schema]]
- [[Environment Variables]]
- [[User Entity]]
- [[Protocol Entity]]
