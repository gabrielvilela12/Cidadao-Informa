---
tags: [domain/admin, layer/frontend, type/page]
aliases: [Admin Home, Dashboard Administrativo, /admin]
---

# AdminDashboard

> Landing page for admin users. Shows KPI summary cards and a recent protocols table.

## Route

`/admin` — redirected here for `role === "admin"` users after login.

## Data

Fetches all protocols via `api.getProtocols()` (no userId filter). Counts by status to populate KPI cards.

## Code Reference

`src/pages/AdminDashboard.tsx`

## Related

- [[Admin Domain]]
- [[Protocol Lifecycle]] (status counts)
- [[API Overview]] → [[Protocol Endpoints]]
- [[AdminRequestsQueue]] (full queue view)
