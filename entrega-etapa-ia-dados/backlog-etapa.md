# Backlog — IA e análise de dados

Data inicial: 10/10/2026.

IDs dão continuidade à sequência do backlog da Fase 5. Atualização em 10/10/2026: os incrementos foram implementados e verificados; a nova classificação foi publicada no Supabase e comprovada por chamada real.

| ID | User story | Prioridade | Estado |
| --- | --- | --- | --- |
| US27 | Como gestor, quero consultar indicadores calculados no banco por período, para avaliar volume, conclusão, tempo de atendimento e custos. | Alta | Implementada; SQL, JDBC, HTTP e navegador verificados |
| US28 | Como gestor, quero consultar rankings de recorrência e evolução mensal, para direcionar ações com base nos relatos recebidos. | Alta | Implementada; consultas e resultados documentados |
| US29 | Como servidor, quero entender a prioridade sugerida pela IA, para revisar a triagem com uma justificativa clara. | Alta | Implementada; testes aprovados; Edge Function publicada e chamada real validada |
| US30 | Como servidor, quero consultar agrupamentos com processamento eficiente, para manter a resposta do sistema conforme o volume de relatos aumenta. | Alta | Implementada e testada |
| US31 | Como integrante do grupo, quero reunir consultas, resultados, testes e demonstrações reproduzíveis, para comprovar as evoluções na entrega acadêmica. | Alta | Evidências técnicas registradas; PDFs, slides, vídeo e ZIP pendentes |

## US27 — Indicadores integrados

- A API obtém indicadores por consultas ao PostgreSQL e a interface apresenta seus resultados.
- O período possui uma regra explícita de aplicação, inclusive para criação e conclusão dos chamados.
- A API limita os resultados ao escopo autorizado do usuário; filtros do navegador não substituem autorização.
- Protocolos com exclusão lógica são desconsiderados nas análises normais.
- Tempo médio considera somente registros com datas confiáveis de criação e conclusão; a cobertura é informada.
- Custos ausentes não são confundidos com custo zero; a cobertura é informada.
- A resposta identifica período e momento de geração.
- A tela trata carregamento, ausência de dados e erro.
- Os valores exibidos são conferidos com a consulta SQL correspondente.

## US28 — Ranking e evolução temporal

- Consultas incluem agrupamentos e pelo menos uma subconsulta ou função avançada pertinente à atividade.
- O ranking declara seu critério de agrupamento e desempate e não mistura dados de prefeituras sem autorização.
- A série mensal explicita período, fuso e tratamento de meses sem registros.
- Os scripts SQL e seus parâmetros são preservados para reprodução.
- Resultados da execução são registrados com a origem dos dados e interpretação das informações.

## US29 — IA explicável

- A resposta contém prioridade válida e justificativa, em estrutura validada antes de sua utilização.
- O limite de saída permite a resposta prevista pelo contrato.
- O servidor visualiza o motivo quando a classificação é concluída com sucesso.
- A revisão manual de prioridade continua disponível aos perfis autorizados.
- Resposta inválida ou indisponibilidade não impede consultar ou acompanhar o protocolo.
- Falhas são registradas e o fluxo existente de reprocessamento é preservado ou ajustado conforme necessário.
- A documentação identifica os dados enviados, a integração e os benefícios e limitações.
- Uma execução de ponta a ponta comprova o fluxo antes de declarar a história validada.

## US30 — Busca eficiente no agrupamento

- A seleção do protocolo principal usa busca do mínimo quando apenas esse resultado é necessário.
- Preserva o critério atual: menor data de criação e, em empate, menor identificador.
- Contagem, limiar de agrupamento, limiar de alerta e sincronização de status são preservados.
- Os testes relevantes verificam grupos unitários, múltiplos membros e empate de datas.
- A documentação compara O(m log m) e O(m) para o trecho alterado, definindo `m` como membros do grupo.
- Nenhuma melhoria de tempo medida é declarada sem medição reproduzível.

## US31 — Evidências e documentação

- O histórico distingue mudanças planejadas, implementadas e verificadas.
- Registra arquivos alterados, comandos de verificação e resultados sem expor segredos.
- A comparação com a última entrega separa funcionalidades anteriores dos incrementos desta etapa.
- A documentação final cobre as quatro partes do enunciado.
- Slides, vídeo e pacote final seguem os limites e requisitos registrados no contexto.

## Sequência prevista

1. Otimização do agrupamento e verificação das regras existentes.
2. Retorno e exibição da justificativa da IA.
3. Consultas SQL, API e integração dos indicadores à interface.
4. Execução, interpretação e registro das evidências.
5. Consolidação da documentação e materiais de entrega.
