# Incremento de 12 de outubro de 2026

## Exportação e validação de datas

Acrescentada a exportação CSV ao bloco de análise do atendimento. O arquivo usa os dados já carregados pela API autorizada, sem consulta adicional e sem dados pessoais dos solicitantes. Inclui período aplicado, fuso, instante da coleta, métricas, cobertura, distribuição, meses, ranking e regras de cálculo.

O escape preserva aspas, separadores e quebras de linha. Texto iniciado por fórmula, inclusive após espaços e controles, recebe prefixo seguro. Valores numéricos zero continuam distintos de valores ausentes. A construção percorre as linhas exportadas em tempo linear em relação ao conteúdo do arquivo.

A tela também verifica datas invertidas e o limite inclusivo de 731 dias. Erros de formulário ficam separados das falhas da consulta. O botão CSV fica desabilitado durante carregamento, falha ou período inválido.

## Arquivos de implementação

- `src/utils/operationalAnalyticsCsv.ts`.
- `src/components/admin/OperationalAnalyticsPanel.tsx`.
- `src/__tests__/operationalAnalyticsCsv.test.ts`.

## Verificação

- TypeScript, build e 121 testes de frontend aprovados em 12/10/2026.
- Três novos testes verificam cobertura e ausência, caracteres especiais, fórmulas textuais e meses vazios.
- Navegação local real com Servidor RP: período aplicado de 01/08 a 10/10/2026, CSV baixado e lido por parser independente.
- Todas as 44 linhas possuem 9 colunas; total 351 e tempo médio `Sem dados` conferidos.
- Intervalo superior a 731 dias mostra erro e desabilita a exportação.
- Console do navegador sem erros na verificação.
- API de produção consultada novamente em 12/10/2026: 351 relatos, 102 concluídos, 29,06%, R$ 29.520,00, cobertura financeira 96/102. Justificativa da IA persistida confirmada, sem nova chamada paga ao modelo.

## Materiais da atividade

Documento PDF consolidado cobre as partes 1, 2, 3 e 4. Apresentação revisada possui até 10 slides, com nomes, RMs e fotos dos integrantes no primeiro slide. A fonte de identidade é a apresentação local da Fase 5, e o usuário confirmou os integrantes nesta conversa.

Vídeo anterior: https://www.youtube.com/watch?v=DbD1ryllxqM. Por orientação do usuário, ele é identificado somente como referência anterior. O campo do vídeo desta etapa permanece reservado até a nova gravação e publicação não listada.

Evidências: `evidencias/indicadores-rp-2026-10-12.csv` e `evidencias/verificacao-producao-2026-10-12.json`.
