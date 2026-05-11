---
tags: [domain/admin, layer/frontend, type/page]
aliases: [Fila de Solicitações, Admin Queue, /admin/solicitacoes]
---

# AdminRequestsQueue

> Full protocol queue with filtering, sorting, and WhatsApp contact shortcut.

## Route

`/admin/solicitacoes`

## Features

- Filter by status, category, search text
- Click row → [[ProtocolDetails]] page
- WhatsApp button uses `phone` field from [[User Entity]] — set by citizen in [[Profile]] page

## Code Reference

`src/pages/AdminRequestsQueue.tsx`

## Related

- [[Admin Domain]]
- [[Protocol Domain]]
- [[ProtocolDetails]]
- [[Protocol Lifecycle]]
