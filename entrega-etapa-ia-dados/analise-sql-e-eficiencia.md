# Análise SQL e eficiência dos dados

## Implementação e integração

Foi acrescentado o endpoint `GET /api/admin/analytics?startDate=AAAA-MM-DD&endDate=AAAA-MM-DD`. O novo bloco do Dashboard Executivo consulta essa rota, e a API executa SQL parametrizado no PostgreSQL. Os indicadores não exigem carregar descrições, fotos ou dados pessoais dos solicitantes.

As consultas ficam em `backend-java/src/main/resources/analytics/` e são carregadas por `OperationalAnalyticsRepository`. `OperationalAnalyticsService` valida o período e extrai o escopo do usuário autenticado. As quatro consultas são executadas na mesma transação de leitura, com isolamento `REPEATABLE_READ`, para obter resultados consistentes entre os componentes.

### Regras de escopo e período

- Cidadão não pode usar a rota administrativa; recebe `403`.
- Ausência de sessão recebe `401`.
- Servidor/diretor com prefeitura vinculada consulta somente esse estabelecimento, seguindo o modelo operacional existente.
- Administrador sem prefeitura vinculada consulta apenas suas UFs delegadas; conjunto vazio não libera todos os dados.
- Dono da plataforma pode consultar o conjunto global.
- O intervalo é inclusivo nas datas informadas e convertido em limite superior exclusivo no início do dia seguinte, no fuso `America/Sao_Paulo`.
- O período máximo possui 731 dias inclusivos; período invertido ou maior recebe `400`.
- Protocolos com `deleted_at` preenchido são excluídos explicitamente, pois SQL direto não aplica automaticamente a restrição do Hibernate.
- O seletor deste bloco é independente dos filtros dos cartões anteriores; a interface informa essa regra.

### Definição das métricas

| Métrica | Regra |
| --- | --- |
| Total e distribuição | Protocolos criados no intervalo, separados por categoria e status atual. |
| Taxa de conclusão | Quantidade atualmente concluída dividida pelo total criado no intervalo. Não representa um SLA contratual. |
| Tempo médio | Intervalo entre criação e resolução, somente para concluídos com datas não nulas e resolução igual ou posterior à criação. |
| Custos | Soma e média dos valores não nulos dos concluídos da amostra. Zero é um valor válido; ausência permanece ausente. |
| Cobertura | Quantos concluídos possuem datas válidas e quantos possuem custo informado. |
| Entradas mensais | Contagem pela data de criação. Meses vazios aparecem com zero. |
| Conclusões mensais | Contagem pela data de resolução no intervalo, incluindo protocolos criados anteriormente; sem data válida, o registro fica fora da série. Reabertura limpa a resolução e remove o registro das conclusões atuais. |
| Ranking de recorrência | Até 10 grupos com ao menos dois relatos, agrupados por prefeitura, UF, chave de local e causa. `DENSE_RANK` mantém a mesma posição para contagens iguais. |

São usados `GROUP BY`, `COUNT`, `SUM`, `AVG`, agregações com `FILTER`, subconsultas via CTE, `DENSE_RANK() OVER (...)`, `DATE_TRUNC` e `GENERATE_SERIES`.

## Resultados executados no banco do projeto

Coleta em 10/10/2026. Amostra: prefeitura de demonstração de São Paulo (`est-demo-sao-paulo`), protocolos criados de 01/08/2026 a 10/10/2026. Estes são dados fictícios de demonstração, e não indicadores reais da prefeitura.

| Indicador | Resultado |
| --- | --- |
| Protocolos criados | 352 |
| Atualmente concluídos | 102 |
| Taxa de conclusão | 28,98% |
| Concluídos com datas válidas | 0 de 102 |
| Tempo médio | Indisponível por ausência de datas válidas |
| Concluídos com custo informado | 96 de 102 |
| Custo total registrado | R$ 29.520,00 |
| Custo médio informado | R$ 307,50 |

### Distribuição por categoria

| Categoria | Aberto | Em análise | Concluído | Total |
| --- | --- | --- | --- | --- |
| Auditiva | 17 | 12 | 15 | 44 |
| Física | 74 | 51 | 51 | 176 |
| Outros | 19 | 12 | 12 | 43 |
| Visual | 35 | 30 | 24 | 89 |
| Total | 145 | 105 | 102 | 352 |

### Evolução mensal

| Mês | Criados | Conclusões com data válida |
| --- | --- | --- |
| Agosto/2026 | 150 | 0 |
| Setembro/2026 | 202 | 0 |
| Outubro/2026, até dia 10 | 0 | 0 |

Os zeros na coluna de conclusão não significam que nenhum serviço foi concluído: 102 registros possuem status concluído, mas nenhum possui data válida de resolução na amostra. Por isso, não é possível distribuí-los cronologicamente. Não foi feito preenchimento artificial do histórico.

O primeiro grupo do ranking contém 8 relatos de categoria Auditiva na Praça da Sé, 100. Grupos com 5 relatos compartilham a posição 2. A contagem é de protocolos, não necessariamente de cidadãos distintos, e recorrência não comprova que todos os relatos representam uma única ocorrência real.

### Interpretação

- A categoria Física concentra 176 de 352 registros, ou 50% da amostra, permitindo discutir alocação de equipe na demonstração.
- A maioria dos chamados permanece aberta ou em análise: 250 registros. Isso indica o tamanho da fila atual, sem permitir concluir a causa da demora.
- Seis conclusões não possuem custo informado. O total financeiro é parcial, e a média se refere aos 96 valores disponíveis.
- A ausência de datas de resolução impede análise confiável da duração e produtividade mensal do histórico. A coleta correta nas novas conclusões é essencial.
- O ranking permite localizar concentrações de relatos para investigação e manutenção preventiva; não substitui vistoria.

## Reprodução

- `sql/consultas-demonstracao.sql`: as mesmas consultas da aplicação com os parâmetros da coleta fixados, em transação somente de leitura.
- `evidencias/resultados-sql.json`: respostas coletadas no PostgreSQL para as quatro consultas.
- O script não altera tabelas ou dados. Os resultados podem mudar se a base de demonstração for modificada posteriormente.

## Estrutura de dados e algoritmo

`ProtocolLocationGroupService.summarizeForAdmin` usa `LinkedHashMap` para associar chave de local/causa aos protocolos. No cálculo dos metadados, a implementação anterior ordenava uma cópia dos membros apenas para selecionar o primeiro elemento.

A nova implementação usa `min` com o mesmo comparador: data de criação e, em empate, identificador. Ela percorre o grupo uma vez e preserva a ordem da listagem recebida.

| Trecho | Antes | Agora |
| --- | --- | --- |
| Seleção do protocolo principal em grupo de `m` membros | O(m log m), com lista ordenada auxiliar | O(m), com seleção do menor elemento |
| Agrupamento de `n` protocolos via mapa | O(n) esperado para inserções/consultas, considerando chaves limitadas | Mantido |

Não foram removidas ordenações que têm outra finalidade, como a apresentação dos membros no detalhe. Não se declara redução medida de latência; a comparação descreve a complexidade do trecho alterado.

Os testes verificam grupos de 1, 2, 10 e 11 membros, causas diferentes, entrada fora de ordem e empate de datas. As regras de agrupamento a partir de dois relatos e alerta acima de dez continuam preservadas.

Referência: [funções de janela do PostgreSQL](https://www.postgresql.org/docs/current/functions-window.html).
