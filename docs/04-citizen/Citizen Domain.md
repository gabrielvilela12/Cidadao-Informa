---
tags: [type/hub, domain/citizen]
aliases: [Citizen, Cidadão, Citizen Portal]
---

# Citizen Domain

> Everything the citizen interacts with: opening requests, tracking protocols, map view, and city services.

## Pages in This Domain

- [[CitizenDashboard]] — `/` — welcome + quick stats
- [[NewRequest]] — `/nova-solicitacao` — form to open a protocol
- [[CitizenProtocols]] — `/meus-protocolos` — personal protocol list
- [[CitizenMap]] — `/mapa` — map of city protocols
- [[CitizenServices]] — `/servicos` — informational city services

## Journey

[[Citizen Journey]] — full flowchart from landing to protocol resolution

## Access Control

Default role after registration. Citizens cannot access `/admin/*` routes.

## Related Domains

- [[Auth Domain]] — login/register entry point
- [[Protocol Domain]] — protocols created and tracked here
- [[Infrastructure Overview]] → [[Supabase]] — data persistence
