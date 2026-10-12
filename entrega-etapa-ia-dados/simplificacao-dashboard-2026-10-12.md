# Simplificação do Dashboard Executivo — 12/10/2026

O usuário solicitou retirar integralmente o bloco “Análise do atendimento por período”, apresentado em uma captura de tela, para simplificar o visual do sistema.

Foi removido o componente `OperationalAnalyticsPanel` e sua integração em `AdminDashboard`. Saíram da tela os filtros independentes de datas, o botão de exportação dos indicadores, as quatro métricas do bloco, as tabelas de categoria/status e evolução mensal e o ranking de recorrência.

O dashboard mantém seus indicadores principais, filtros de ano e bairro, exportação geral e gráficos existentes. A remoção é da interface: consultas SQL, endpoint de análise, evidências coletadas e utilitário CSV foram preservados no projeto.

## Contexto para a entrega acadêmica

O PDF e os slides produzidos anteriormente registram a versão com o painel de análise. Após esta simplificação, a navegação descrita para aplicar período e exportar indicadores nesse painel não está disponível no dashboard. O material deverá refletir a interface atual antes da gravação final. A demonstração da justificativa da IA nos detalhes do protocolo continua disponível; os scripts e resultados SQL continuam documentados.

## Verificação

`npm run lint`, `npm run build` e a conferência do diff foram aprovados. O build mantém os avisos de bundle preexistentes. Navegação local autenticada com Servidor RP confirmou o carregamento dos indicadores e gráficos e a ausência do painel removido. A captura do visual atual está em `evidencias/dashboard-simplificado-2026-10-12.png`.
