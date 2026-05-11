---
tags: [domain/infra, type/config]
aliases: [Deployment, Vercel, CI/CD]
---

# Deploy

> Deployment configuration for the Cidadao Informa frontend.

## Frontend — Vercel

Configured via `vercel.json`. The SPA is deployed as a static site. All routes rewrite to `index.html` for client-side routing.

```json
{
  "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]
}
```

Build command: `npm run build` → outputs to `dist/`.

## Backend — Spring Boot

Not deployed to a public host in the current setup. Runs locally for academic/hackathon demonstration. To deploy, requires JDBC credentials and `JWT_SECRET` in environment — see [[Environment Variables]].

## Related

- [[Infrastructure Overview]]
- [[Environment Variables]]
- [[Tech Stack]]
