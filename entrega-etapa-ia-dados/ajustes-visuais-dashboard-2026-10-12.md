# Ajustes visuais do dashboard — 12/10/2026

Por solicitação do usuário, foram retirados dois trechos indicados em capturas de tela:

- A faixa inferior do Dashboard Executivo com os contadores de aguardando triagem, em análise e em atraso. O componente auxiliar e os imports sem uso foram removidos.
- O parágrafo explicativo abaixo da tabela de entradas e conclusões mensais no painel de análise do atendimento.

Arquivos alterados: `src/pages/AdminDashboard.tsx` e `src/components/admin/OperationalAnalyticsPanel.tsx`.

Os cálculos SQL, a API, o CSV e os demais indicadores permanecem com as mesmas regras. A documentação acadêmica mantém a explicação da série mensal.

Verificação: `npm run lint` e `npm run build` aprovados. O build mantém os avisos de bundle já existentes. Navegação local autenticada confirmou que o painel carrega e os dois trechos não aparecem na página.
