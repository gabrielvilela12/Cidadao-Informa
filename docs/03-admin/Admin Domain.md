---
tags: [type/hub, domain/admin]
aliases: [Admin, Administração, Prefeitura]
---

# Admin Domain

> Everything the city administration sees and does: protocol queue, map heat-view, and analytics reports.

## Pages in This Domain

- [[AdminDashboard]] — `/admin` — KPI cards and recent protocols
- [[AdminRequestsQueue]] — `/admin/solicitacoes` — sortable/filterable queue
- [[AdminMap]] — `/admin/mapa` — Leaflet map with protocol pins
- [[AdminReports]] — `/admin/relatorios` — Recharts charts

## Access Control

Admin pages are gated by `role === "admin"` in `App.tsx`. Citizens are redirected to `/`.

## Related Domains

- [[Protocol Domain]] — all admin pages consume protocol data
- [[Auth Domain]] — role check for access control
- [[Citizen Domain]] — mirror of citizen features with admin power
- [[API Overview]] → [[Protocol Endpoints]]
