---
tags: [domain/infra, type/config]
aliases: [Env Vars, .env, Environment]
---

# Environment Variables

> Required environment variables for the frontend. Defined in `.env` or Vercel project settings.

## Frontend (Vite)

| Variable | Required | Description |
|----------|----------|-------------|
| `VITE_SUPABASE_URL` | Yes | Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Yes | Supabase anonymous (public) key |

If missing, `supabase.ts` falls back to hardcoded values with a `console.warn`.

## Backend (Spring Boot)

Configure in `application.properties` or system env:

| Variable | Description |
|----------|-------------|
| `SPRING_DATASOURCE_URL` | JDBC URL for Supabase PostgreSQL |
| `SPRING_DATASOURCE_USERNAME` | DB username |
| `SPRING_DATASOURCE_PASSWORD` | DB password |
| `JWT_SECRET` | Secret key for JJWT signing |

## Code Reference

`src/services/supabase.ts` — frontend client init

## Related

- [[Infrastructure Overview]]
- [[Supabase]]
- [[Deploy]]
