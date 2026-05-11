---
tags: [type/diagram, domain/overview]
aliases: [Stack, Technologies, Tecnologias]
---

# Tech Stack

> Full technology inventory for Cidadao Informa.

## Frontend

| Technology | Version | Purpose |
|-----------|---------|---------|
| React | 19 | UI framework |
| TypeScript | 5.x | Type safety |
| Vite | 6.x | Build tool + dev server |
| React Router | 7.x | Client-side routing |
| Tailwind CSS | 4.x | Utility-first styling |
| Leaflet / React-Leaflet | — | Interactive maps |
| Recharts | — | Admin charts and reports |
| Supabase JS | 2.x | Direct DB client (production) |
| bcryptjs | — | Password hashing in browser |

## Backend (Spring Boot)

| Technology | Purpose |
|-----------|---------|
| Java 21 | Runtime |
| Spring Boot 3 | Web framework |
| Spring Security | JWT filter chain |
| JPA / Hibernate | ORM |
| PostgreSQL | Database |
| JJWT | JWT generation and parsing |
| SpringDoc OpenAPI | Swagger UI |

## Infrastructure

| Service | Purpose |
|---------|---------|
| Supabase | Hosted PostgreSQL + anonymous API key |
| Vercel | Frontend deploy (static SPA) |

## Related

- [[Architecture]]
- [[Infrastructure Overview]]
- [[Supabase]]
