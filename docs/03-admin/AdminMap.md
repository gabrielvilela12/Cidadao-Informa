---
tags: [domain/admin, layer/frontend, type/page]
aliases: [Mapa Admin, Admin Map, /admin/mapa]
---

# AdminMap

> Leaflet map showing all protocols as pins, color-coded by status.

## Route

`/admin/mapa`

## Implementation

Uses `react-leaflet`. Protocol `address` field is geocoded client-side. Pin color maps to [[Protocol Lifecycle]] status.

## Code Reference

`src/pages/AdminMap.tsx`

## Related

- [[Admin Domain]]
- [[CitizenMap]] (citizen-facing equivalent)
- [[Protocol Entity]]
