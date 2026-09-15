# Análise estatística — Cidadão Informa

## Objetivo

Esta análise transforma os protocolos em informações para triagem, planejamento de equipes e prestação de contas. Ela combina indicadores disponibilizados pela API com uma base fictícia e reproduzível de demonstração. Nenhum número deste documento deve ser apresentado como dado oficial de um município.

## Universo e fonte

O recorte de demonstração está descrito em `supabase/seed/README.md` e contém 554 protocolos fictícios distribuídos por 32 cidades. A geração usa semente fixa, portanto as frequências são reproduzíveis. As datas são relativas ao momento em que o seed é aplicado.

Na aplicação, os cálculos são produzidos por `GET /api/transparency`. Protocolos logicamente excluídos não integram a amostra. A resposta informa o instante de geração e a cobertura das variáveis que podem estar ausentes.

## Indicadores descritivos implementados

| Indicador | Universo válido | Medidas |
| --- | --- | --- |
| Tempo até a conclusão | Concluídos com `created_at` e `resolved_at` válidos | média, mediana, P90 e desvio-padrão, em horas |
| Idade do backlog | Protocolos não concluídos com data de abertura válida | média, mediana, P90 e desvio-padrão, em dias |
| Custo de resolução | Concluídos com custo não negativo | média, mediana, P90 e desvio-padrão, em reais |
| Cobertura | Registros válidos dividido pelo universo correspondente | percentual de cobertura de tempo e custo |
| SLA ativo | Protocolos não concluídos comparados ao prazo da prioridade | no prazo, próximo do prazo, atrasado e taxa de conformidade |

As fórmulas aplicadas são:

- média: soma dos valores dividida pelo tamanho da amostra;
- mediana: valor central da amostra ordenada, ou média dos dois centrais quando a quantidade é par;
- P90: menor valor que cobre pelo menos 90% da amostra ordenada, usando o método de posto mais próximo;
- desvio-padrão populacional: raiz quadrada da média dos desvios quadráticos em relação à média;
- taxa de conclusão: protocolos concluídos divididos pelo total de protocolos;
- cobertura: registros válidos divididos pelo universo que deveria possuir o campo.

## Distribuição da base de demonstração

### Status

| Status | Quantidade | Participação |
| --- | ---: | ---: |
| Aberto | 215 | 38,81% |
| Em análise | 135 | 24,37% |
| Concluído | 204 | 36,82% |
| **Total** | **554** | **100,00%** |

Interpretação: 350 protocolos, ou 63,18% da base, continuam ativos. A taxa de conclusão é 36,82%. Em um cenário real, esse indicador deve ser analisado junto da idade do backlog: um estoque alto pode representar tanto crescimento recente da demanda quanto capacidade insuficiente de atendimento.

### Categorias

| Categoria | Quantidade | Participação |
| --- | ---: | ---: |
| Física | 275 | 49,64% |
| Visual | 121 | 21,84% |
| Auditiva | 84 | 15,16% |
| Outros | 74 | 13,36% |
| **Total** | **554** | **100,00%** |

A categoria modal é **Física**, próxima de metade dos registros. Para a gestão, isso sugere reservar capacidade para intervenções físicas e, antes de ampliar recursos, decompor a categoria por causa e região para verificar concentração e recorrência.

### Prioridade e qualidade da triagem

| Prioridade | Quantidade | Participação |
| --- | ---: | ---: |
| Crítica | 49 | 8,84% |
| Alta | 121 | 21,84% |
| Média | 192 | 34,66% |
| Baixa | 129 | 23,29% |
| Sem classificação | 63 | 11,37% |
| **Total** | **554** | **100,00%** |

A cobertura de classificação é 88,63%: 491 registros têm prioridade e 63 permanecem sem triagem. A gestão pode acompanhar a cobertura por período e investigar falhas da fila de IA, sempre mantendo a revisão humana da sugestão.

### SLA das demandas ativas

| Situação | Quantidade | Percentual entre os 350 ativos |
| --- | ---: | ---: |
| Dentro do prazo | 184 | 52,57% |
| Próximo do vencimento | 26 | 7,43% |
| Em atraso | 140 | 40,00% |
| **Total ativo** | **350** | **100,00%** |

Considerando “dentro do prazo” e “próximo do vencimento”, a conformidade é 60%. Os 40% atrasados constituem o grupo de intervenção imediata. A recomendação é cruzar atraso com prioridade, região e causa para evitar que o volume isolado favoreça bairros com mais registros, mas não necessariamente com maior gravidade.

### Cobertura geográfica

543 dos 554 protocolos possuem coordenadas, cobertura de 98,01%; 11 registros, ou 1,99%, ficam corretamente fora do mapa. A ausência não é preenchida com coordenada fictícia. O painel geográfico público agrega as posições em uma grade, enquanto o detalhe do protocolo pode preservar a localização da ocorrência necessária ao atendimento.

## Leitura de média, mediana, P90 e desvio-padrão

Essas quatro medidas devem ser interpretadas em conjunto:

- se a média for muito maior que a mediana, poucos casos demorados ou caros estão puxando o valor para cima;
- a mediana representa melhor o caso típico quando existem valores extremos;
- o P90 informa o limite observado para 90% dos atendimentos e ajuda a definir uma meta operacional realista;
- o desvio-padrão mostra a variabilidade: quanto maior, menos previsível é o processo.

Exemplo de leitura: se a mediana do tempo for 72 horas e o P90 for 360 horas, metade termina em até três dias, mas a cauda mais lenta chega a quinze dias. A decisão não seria apenas reduzir a média, mas investigar os 10% de maior duração por categoria e território. Esse exemplo é ilustrativo; os números efetivos devem ser capturados da API no dia da entrega.

## Limitação histórica de `resolved_at`

O campo `resolved_at` passa a ser preenchido a partir desta fase quando o status muda para concluído, e é limpo se o protocolo for reaberto. Protocolos antigos já concluídos podem não possuir essa data. Eles continuam nas contagens de status e custo, mas ficam fora do cálculo do tempo de resolução.

Essa escolha evita inventar uma duração. A tela apresenta `completedWithoutResolvedAt` e `resolutionTimeCoverageRate`, permitindo ao leitor avaliar a qualidade da amostra. Com o uso contínuo, a cobertura tende a crescer organicamente.

## Gráficos e tabelas disponíveis

O painel de transparência apresenta:

1. cartões de volume, conclusão, custo e cobertura;
2. gráfico de barras com registros e situação atual por mês;
3. distribuições por status, categoria e prioridade;
4. tabela visual de estatística descritiva para tempo, backlog e custo;
5. quadro de SLA dos protocolos ativos;
6. mapa geográfico agregado e lista pública anonimizada.

Para o documento final e os slides, recomenda-se capturar três visuais: distribuição por status, SLA ativo e o quadro de estatística descritiva. Cada figura deve conter fonte, instante de extração e indicação de que a base é demonstrativa, quando for o caso.

## Sugestões para a gestão pública

- Priorizar os 140 protocolos demonstrativos em atraso, começando por críticos e altos.
- Investigar a categoria Física por região e causa, pois ela concentra 49,64% dos registros.
- Criar meta de cobertura para prioridade, custo e data de conclusão; uma média sem cobertura adequada pode induzir decisões incorretas.
- Usar mediana e P90 como metas complementares: a primeira representa o atendimento típico e a segunda controla os casos de cauda longa.
- Direcionar manutenção preventiva para locais com repetição da mesma causa, evitando contar múltiplos relatos como múltiplas obras e inflar custos.
- Monitorar a diferença entre entradas e conclusões a cada mês para saber se o backlog cresce ou diminui.

## Cuidados de interpretação

As frequências demonstram associação e concentração, não causalidade. Um bairro com mais protocolos pode possuir mais problemas, maior população, maior acesso digital ou maior engajamento. Comparações territoriais por habitante só devem ser feitas com fonte populacional oficial, período equivalente e citação explícita.

