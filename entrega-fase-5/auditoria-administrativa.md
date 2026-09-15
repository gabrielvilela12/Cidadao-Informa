# Auditoria de consultas sensíveis e exportações

## Resumo

Implementar uma trilha administrativa para registrar consulta de dados pessoais e exportação de dados operacionais, sem copiar o conteúdo sensível para a auditoria.

## Contexto

O Cidadão Informa já possuía uma cadeia de hashes para alterações de protocolos, como criação, status, prioridade, custo e exclusão lógica. Consultas ao cadastro de cidadãos e exportações administrativas, entretanto, ainda não geravam evidência própria.

Essas operações não alteram o protocolo, mas podem expor ou retirar informações do ambiente da aplicação. Por isso, precisam de uma trilha com finalidade e acesso diferentes da auditoria operacional do protocolo.

## Problema

Sem esse registro, não seria possível responder com segurança quem consultou um cadastro sensível, quem iniciou uma exportação, quando a ação ocorreu e qual foi seu resultado.

## Objetivo

Registrar acessos e exportações administrativas relevantes com ator obtido do JWT, data/hora, ação, tipo de recurso, resultado, escopo do estabelecimento e metadados mínimos. Identificadores dos cidadãos ou relatórios são protegidos por SHA-256 antes da persistência.

## Análise de impacto

A mudança aumenta a responsabilização dos perfis administrativos e fornece evidências para investigação de acesso indevido. O fluxo do cidadão não é alterado.

No back-end, foi criada uma tabela exclusiva e append-only na aplicação, um serviço de gravação, auditoria automática nas consultas de cidadãos e endpoints para exportação e pesquisa. No front-end, as exportações administrativas solicitam o registro de auditoria antes de gerar o arquivo. Se a API não autorizar ou não registrar o evento, o download não é iniciado pelo fluxo normal.

A trilha administrativa não substitui logs técnicos nem a cadeia do protocolo. Ela registra ações humanas de leitura/extração; logs técnicos continuam destinados a erros e desempenho, enquanto a cadeia do protocolo preserva evidências das mudanças no atendimento.

## Escopo de desenvolvimento

- Banco: tabela `administrative_audit_events`, índices por data, ator e ação, RLS e revogação de acesso direto.
- API: registro de exportação e pesquisa paginada da trilha.
- Consultas sensíveis: auditoria da lista e do detalhe de cidadãos e das tentativas negadas por permissão de tela.
- Front-end: auditoria das exportações da fila, dashboard, mapa e relatórios PDF/XLSX/CSV.
- Segurança: ator derivado exclusivamente do JWT e consulta global restrita ao gestor da plataforma.
- Testes: hash do recurso, allowlist de formato/recurso, pesquisa e autorização.

## Regras de negócio

- O cliente não pode informar o ator; `actor_id`, papel e estabelecimento vêm da sessão autenticada.
- CPF, telefone, endereço residencial, descrição, imagem, token e conteúdo do arquivo não devem ser gravados na auditoria.
- O identificador do recurso sensível deve ser persistido apenas como hash SHA-256.
- A exportação aceita somente recursos administrativos conhecidos e formatos CSV, XLSX ou PDF.
- A quantidade exportada deve estar entre 1 e 1.000.000 de registros.
- Exportações de relatórios e cidadãos devem respeitar também a permissão de tela correspondente.
- Tentativas negadas por permissão devem produzir `SENSITIVE_ACCESS_DENIED`.
- Somente o gestor da plataforma pode pesquisar a trilha administrativa global.
- Registros da trilha não possuem endpoint de alteração ou exclusão.

## Eventos registrados

| Evento | Momento | Metadados não sensíveis |
| --- | --- | --- |
| `SENSITIVE_CITIZEN_LIST_VIEWED` | Lista administrativa de cidadãos consultada | quantidade retornada e finalidade fixa |
| `SENSITIVE_CITIZEN_VIEWED` | Detalhe de cidadão consultado | hash do cidadão e quantidade de protocolos |
| `SENSITIVE_ACCESS_DENIED` | Permissão de tela nega consulta/exportação | tipo e hash do recurso, quando existente |
| `DATA_EXPORTED` | Interface administrativa autoriza o download | formato, quantidade, finalidade e hash opcional do relatório |
| `ADMINISTRATIVE_AUDIT_TRAIL_VIEWED` | Gestor global pesquisa a própria trilha | filtro de ação, quantidade retornada e hash do ator filtrado |

## Endpoints

### Registrar uma exportação

`POST /api/admin/audit/exports`

```json
{
  "resourceType": "DAILY_REPORT_DETAIL",
  "format": "PDF",
  "recordCount": 42,
  "resourceId": "identificador-interno-do-relatorio"
}
```

Retorna `201` com o evento gravado. O `resourceId` original não aparece na resposta; somente seu hash.

### Pesquisar a trilha

`GET /api/admin/audit/events?action=DATA_EXPORTED&actorId=admin-1&from=2026-09-01T00:00:00Z&to=2026-10-01T00:00:00Z&page=0&size=20`

A pesquisa é paginada, aceita filtros por ação, ator e período e é exclusiva do perfil `platform_owner`.

## Critérios de aceite

- Deve registrar a consulta bem-sucedida à lista e ao detalhe de cidadãos.
- Deve registrar tentativa negada por ausência da permissão de tela.
- Deve impedir a exportação pelo fluxo normal quando o evento não puder ser registrado.
- Deve obter o ator da autenticação e ignorar qualquer tentativa do cliente de defini-lo.
- Deve substituir o identificador sensível do recurso por um hash SHA-256.
- Deve gravar somente formato, quantidade e finalidade fixa como metadados da exportação.
- Deve permitir pesquisa paginada por ação, ator e período somente ao gestor da plataforma.
- Deve rejeitar recursos, formatos, períodos e tamanhos de página inválidos.
