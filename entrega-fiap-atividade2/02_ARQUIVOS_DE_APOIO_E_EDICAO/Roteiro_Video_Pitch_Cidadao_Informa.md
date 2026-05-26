# Roteiro do Video Pitch - Cidadao Informa

**Duracao alvo:** cerca de 5 minutos  
**Formato:** video no YouTube como nao listado  
**Link final:** https://youtu.be/INSERIR_LINK_DO_VIDEO_NAO_LISTADO

## 0:00 a 0:25 - Abertura e grupo

Ola, somos Gabriel e Luis Gustavo, e este e o nosso projeto Cidadao Informa, desenvolvido para o HackGov/FIAP em parceria com a EGESP. A proposta e aproximar o cidadao da prefeitura, facilitando o registro e o acompanhamento de problemas urbanos, principalmente ligados a acessibilidade.

## 0:25 a 1:05 - Contexto do problema

Muitas demandas de zeladoria e acessibilidade urbana ainda chegam por canais dispersos, sem protocolo claro, sem acompanhamento simples para o cidadao e sem indicadores consolidados para a prefeitura. Isso dificulta saber o que foi resolvido, o que esta atrasado e quais casos precisam de prioridade.

## 1:05 a 1:55 - Solucao e prototipo funcional

O Cidadao Informa resolve esse problema com uma jornada digital completa. O cidadao faz login, abre uma solicitacao, informa categoria, endereco e descricao, e depois acompanha o protocolo. Ja o servidor publico acessa a fila administrativa, dashboard, mapa, relatorios, exportacao em planilha e logs de IA.

Na tela de prototipo, mostramos essa jornada ponta a ponta: login, solicitacao, protocolo, fila admin e relatorios. Isso demonstra que o sistema nao e apenas uma ideia, mas uma solucao navegavel com telas para o cidadao e para a gestao.

## 1:55 a 2:45 - Ciencia de Dados

No dashboard administrativo, o sistema transforma os protocolos em dados para decisao. Ele mostra total de chamados, solicitacoes em analise, atrasos, taxa de resolucao, distribuicao por status, distribuicao por categoria e tendencia mensal. Tambem ha mapas e relatorios para observar concentracoes territoriais e exportar dados para analises externas.

## 2:45 a 3:35 - IA finalizada e funcionando

Nas ultimas atualizacoes, finalizamos a IA de prioridade. A IA analisa a categoria e a descricao do protocolo e classifica o chamado como baixa, media, alta ou critica. Esse resultado aparece como um badge na fila administrativa, ajudando o servidor a identificar rapidamente os casos que precisam de mais atencao.

O servidor tambem pode clicar em Regenerar IA para pedir uma nova classificacao, ou pode trocar a prioridade manualmente quando entender que o contexto exige outra decisao. Essa alteracao pode ser justificada e fica registrada.

## 3:35 a 4:15 - Auditoria e responsabilidade

Como estamos falando de servico publico, a IA foi pensada com responsabilidade. Ela apoia a triagem, mas nao substitui o servidor. A decisao final continua humana. Alem disso, o sistema possui uma tela de Logs IA, que registra classificacoes feitas pela IA e alteracoes manuais feitas pela equipe administrativa.

Isso traz transparencia, rastreabilidade e evita que a inteligencia artificial funcione como uma caixa-preta.

## 4:15 a 4:40 - Tecnologias e evolucao

O projeto usa React, TypeScript, Vite, Tailwind, Recharts, Leaflet, Supabase/PostgreSQL, Java, Spring Boot, autenticacao, seguranca e exportacao em planilhas. Para IA, usamos Supabase Edge Function, OpenRouter e Gemini 2.5 Flash.

As proximas evolucoes incluem filtros por bairro e prioridade, analise territorial mais forte, resumos de protocolos e relatorios executivos automaticos.

## 4:40 a 5:00 - Fechamento

Com o Cidadao Informa, buscamos transformar problemas urbanos em dados organizados e uteis para a gestao publica. O cidadao ganha transparencia, a prefeitura ganha visao operacional, e a IA entra como apoio responsavel para tornar a triagem mais eficiente, auditavel e humana.
