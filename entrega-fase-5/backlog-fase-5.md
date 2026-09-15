# Product Backlog definitivo — Fase 5

## Contexto e objetivo

O backlog foi reavaliado após a evolução do Cidadão Informa para uma aplicação integrada por React, API Java/Spring Boot e PostgreSQL. Nesta fase, as histórias priorizam a conclusão do fluxo de protocolos, a segurança por perfil, a manipulação de arquivos, a transparência estatística e a rastreabilidade das ações relevantes.

O resultado esperado é permitir que o cidadão registre e acompanhe solicitações com segurança, enquanto o poder público organiza o atendimento e toma decisões com base em dados confiáveis.

## Critério de priorização

- **Alta:** necessária para o fluxo principal, segurança, privacidade ou requisito explícito da entrega.
- **Média:** amplia gestão, transparência ou qualidade sem bloquear o fluxo principal.
- **Baixa:** melhoria de produtividade ou evolução futura.

## Backlog consolidado

| ID | Épico | User story | Prioridade | Situação na Fase 5 | Evidência principal |
| --- | --- | --- | --- | --- | --- |
| US01 | Cidadão | Como cidadão, quero criar uma solicitação com categoria, endereço, descrição e localização, para registrar um problema urbano. | Alta | Implementada | Formulário React e `POST /api/protocols` |
| US02 | Cidadão | Como cidadão, quero listar somente meus protocolos, para acompanhar minhas solicitações. | Alta | Implementada | `GET /api/protocols` com escopo extraído do JWT |
| US03 | Cidadão | Como cidadão, quero consultar o detalhe de um protocolo meu, para visualizar seu andamento e evidências. | Alta | Implementada | `GET /api/protocols/{id}` e tela de detalhes |
| US04 | Operação | Como servidor, quero visualizar e filtrar a fila de solicitações do meu escopo, para organizar a triagem. | Alta | Implementada | Fila administrativa, filtros e busca |
| US05 | Operação | Como servidor, quero alterar status, prioridade e custo de resolução, para registrar a execução do atendimento. | Alta | Implementada | Endpoints de status/prioridade e auditoria |
| US06 | API | Como usuário, quero que as telas consumam uma API com contrato previsível, para ter uma experiência consistente. | Alta | Implementada | `src/services/http.ts` e `src/services/api.ts` |
| US07 | Front-end | Como usuário, quero ver carregamento, sucesso, erro e estado vazio, para compreender o resultado das operações. | Alta | Implementada | Estados de interface nos fluxos principais |
| US08 | Segurança | Como usuário autenticado, quero acessar somente recursos permitidos ao meu perfil, para proteger dados pessoais e administrativos. | Alta | Implementada | Spring Security, JWT e validação no servidor |
| US09 | Segurança | Como sistema, quero emitir tokens assinados e com expiração e armazenar senhas com hash, para reduzir o risco de tomada de conta. | Alta | Implementada | JWT, BCrypt e limite de tentativas de login |
| US10 | Arquivos | Como servidor, quero exportar dados em XLSX, para apoiar análise e prestação de contas. | Média | Implementada | Utilitários de exportação administrativa |
| US11 | Auditoria | Como servidor autorizado, quero consultar a trilha de um protocolo, para verificar a integridade de ações críticas. | Média | Implementada | Cadeia de auditoria encadeada por hashes |
| US12 | IA | Como servidor, quero receber uma sugestão de prioridade por IA, para apoiar a triagem sem automatizar a decisão final. | Média | Implementada | Fila persistente de classificação e revisão manual |
| US13 | Acessibilidade | Como usuário, quero recursos de contraste, tema e navegação acessível, para utilizar o sistema com mais conforto. | Média | Implementada | Recursos globais de acessibilidade |
| US14 | Evidências | Como cidadão, quero anexar imagens à solicitação, para comprovar o problema relatado. | Alta | Implementada | Validação, compactação, persistência e exibição |
| US15 | Arquivos | Como cidadão, quero anexar até quatro fotos JPG ou PNG com mensagens claras de validação, para enviar evidências adequadas. | Alta | Implementada | Regras de quantidade, formato e tamanho |
| US16 | Transparência | Como visitante, quero consultar indicadores e protocolos públicos sem visualizar dados pessoais do cidadão, para acompanhar a atuação pública. | Alta | Implementada com risco residual nas fotos | DTO público não envia nome, CPF, e-mail, telefone nem endereço residencial; o local da ocorrência permanece visível |
| US17 | Autorização | Como gestor, quero limitar servidores por estabelecimento, UF e tela, para aplicar o princípio do menor privilégio. | Alta | Implementada | Escopos verificados no back-end |
| US18 | Operação | Como servidor, quero receber novas solicitações e identificar recorrência por local e causa, para reagir rapidamente. | Alta | Implementada | SSE, agrupamento e alerta de recorrência |
| US19 | Relatórios | Como gestor, quero gerar fechamentos em PDF, XLSX e CSV, para analisar resultados e prestar contas. | Alta | Implementada | Relatórios diários, utilitários de exportação e evento `DATA_EXPORTED` |
| US20 | Auditoria | Como encarregado de governança, quero registrar consultas sensíveis e exportações, para saber quem acessou ou extraiu dados pessoais. | Alta | Implementada | Trilha administrativa, auditoria automática, endpoint de exportação e pesquisa global |
| US21 | CRUD | Como cidadão, quero excluir logicamente um protocolo aberto criado por mim, para retirá-lo das consultas sem apagar o histórico. | Alta | Implementada | `DELETE /api/protocols/{id}`, `deleted_at`, `deleted_by` e evento auditável |
| US22 | Arquivos e privacidade | Como titular, quero anexos privados entregues por acesso temporário, para reduzir exposição indevida. | Alta | Parcial | Validação existe; bucket privado e URL assinada permanecem pendentes |
| US23 | API | Como integrador, quero erros padronizados e OpenAPI completa, para tratar falhas de forma previsível. | Alta | Parcial | Status HTTP e `ErrorResponse` existem; padronização global pode evoluir |
| US24 | Estatística | Como gestor, quero visualizar tendência, SLA, média, mediana, P90 e dispersão, para priorizar ações com base em evidências. | Média | Implementada | `GET /api/transparency` e painel público |
| US25 | Estruturas | Como servidor, quero desfazer alterações de filtros, para recuperar rapidamente a visão anterior da fila. | Baixa | Implementada | Pilha LIFO `BoundedStack`, limitada a 20 estados |
| US26 | Auditoria | Como auditor, quero pesquisar a trilha por ator, ação e período, para investigar mudanças críticas. | Média | Parcial | Verificação global e consulta por protocolo existem; busca avançada é pendente |

## Regras de negócio prioritárias

1. O endereço residencial do cidadão é dado pessoal e não deve ser confundido com o local da ocorrência. O local exato do protocolo é necessário para atendimento e pode aparecer na consulta pública definida pelo produto.
2. A exclusão de protocolo é lógica, nunca física, e só pode ser solicitada pelo cidadão proprietário enquanto o status estiver aberto.
3. Servidores, donos de estabelecimento e donos da plataforma não podem usar o endpoint de exclusão de protocolo do cidadão.
4. Ao concluir um protocolo, o sistema registra `resolved_at`; ao reabri-lo, limpa esse campo. Registros históricos sem data confiável não são preenchidos artificialmente.
5. Decisões sugeridas por IA podem ser revistas por um servidor e não concluem protocolos automaticamente.
6. Permissões exibidas no front-end devem ser novamente validadas no back-end.

## Critérios de aceitação das histórias prioritárias da fase

### US15 — Fotos da solicitação

- Deve aceitar apenas os formatos JPG e PNG previstos pela interface e pelo back-end.
- Deve limitar o envio a quatro imagens por protocolo.
- Deve validar tamanho e conteúdo antes da persistência.
- Deve informar o motivo da rejeição sem apagar os demais campos preenchidos.
- As imagens aceitas devem ser associadas ao protocolo e exibidas apenas a perfis autorizados e nas rotas públicas deliberadamente definidas.

### US16 — Transparência pública sem dados pessoais

- O acesso público não deve exigir autenticação.
- A resposta não deve conter nome, CPF, e-mail, telefone ou endereço residencial do cidadão.
- O endereço e as coordenadas da ocorrência podem permanecer disponíveis por serem necessários para localizar o problema urbano.
- Indicadores agregados devem informar data de geração e cobertura da amostra.
- O mapa estatístico deve usar coordenadas agregadas, ainda que o detalhe público do protocolo preserve o local da ocorrência.
- Fotos públicas devem ser tratadas como risco de privacidade e passar por política de moderação antes de um uso real em produção.

### US17 — Controle de acesso delegado

- Deve distinguir cidadão, servidor, dono do estabelecimento e dono da plataforma.
- A autorização deve ser aplicada no servidor usando perfil, estabelecimento, UF e permissão de tela.
- Um gestor não deve delegar escopo superior ao próprio.
- A ausência de autenticação deve produzir `401`; autenticação sem permissão deve produzir `403`.
- O front-end pode ocultar ações, mas isso não substitui a verificação no back-end.

### US19 — Exportação de relatórios

- Deve impedir ou avisar a exportação quando não houver dados.
- O arquivo deve apresentar título, período, indicadores, datas e valores monetários em formato legível.
- A exportação CSV deve neutralizar células que possam ser interpretadas como fórmulas.
- Exportações que contenham dados pessoais devem exigir permissão específica.
- A exportação deve ser precedida pelo registro `DATA_EXPORTED` da US20; se a auditoria falhar, o fluxo normal não deve iniciar o download.

### US20 — Auditoria de consulta sensível e exportação

- Deve registrar ator, papel, ação, data/hora, tipo e identificador do recurso, resultado e finalidade quando aplicável.
- Não deve copiar CPF, telefone, token, descrição integral ou imagem para o registro de auditoria.
- Deve cobrir consulta ao cadastro detalhado do cidadão, exportação administrativa e consulta global sensível.
- Deve registrar sucesso e tentativa negada relevante.
- A trilha deve ser acessível somente a perfis autorizados e pesquisável por ator, ação e período.

### US21 — Exclusão lógica auditada

- Deve disponibilizar `DELETE /api/protocols/{id}` somente ao cidadão autenticado proprietário.
- Deve permitir a exclusão apenas quando o protocolo estiver aberto.
- A interface deve solicitar confirmação antes da chamada.
- Deve preencher `deleted_at` e `deleted_by`, sem apagar fisicamente o registro.
- O protocolo excluído não deve aparecer na área do cidadão, na consulta pública, na fila administrativa nem nas estatísticas normais.
- Deve registrar `PROTOCOL_LOGICALLY_DELETED` sem copiar descrição, endereço ou fotos.
- Deve retornar `204` no sucesso, `401` sem sessão, `403` para outro usuário ou perfil administrativo, `404` quando não encontrado e `409` quando o atendimento já começou.

### US22 — Armazenamento privado de anexos

- O armazenamento deve ser privado por padrão.
- O acesso deve ocorrer por URL assinada de curta duração e somente após autorização.
- O nome físico do arquivo não deve expor CPF, e-mail ou nome do cidadão.
- O sistema deve validar tipo, tamanho e quantidade também no servidor.
- Exclusão, retenção e restauração devem seguir política formal de ciclo de vida.

### US23 — Contrato REST e erros

- Rotas devem usar recursos no plural e métodos HTTP coerentes.
- Criação deve retornar `201`; leitura/alteração, `200`; exclusão sem corpo, `204`.
- Erros devem manter um corpo previsível e não expor stack trace, SQL ou segredo.
- A documentação OpenAPI deve apresentar autenticação, entradas, saídas e códigos relevantes.
- Endpoints críticos devem possuir testes de sucesso, validação, autenticação e autorização.

## Impacto e próximos incrementos

Com US20, US21 e US24 concluídas, a fase atende a auditoria de leitura/exportação, o CRUD principal de protocolos e a estatística descritiva solicitada. A maior lacuna de segurança restante é a US22, que move anexos para armazenamento privado. US23 e US26 ainda podem ampliar a padronização dos erros e a interface de investigação; a pesquisa administrativa por ator, ação e período já está disponível pela API.
