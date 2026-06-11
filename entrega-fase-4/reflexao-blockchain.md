# Reflexao sobre Blockchain

## Referencia GovTech

Uma referencia relevante para o Cidadao Informa e o uso de blockchain na Estonia, dentro do ecossistema e-Estonia. O governo estoniano utiliza a tecnologia KSI Blockchain como mecanismo de seguranca para proteger a integridade de dados governamentais e permitir prova matematica de que registros eletronicos nao foram alterados indevidamente.

Referencia: https://e-estonia.com/solutions/cyber-security/ksi-blockchain/

## Aplicacao no Cidadao Informa

No Cidadao Informa, a blockchain nao deve ser usada como banco de dados principal nem para armazenar informacoes completas das solicitacoes. O sistema lida com dados sensiveis de cidadaos, como CPF, telefone, endereco, descricao do problema e imagens. Registrar esses dados diretamente em uma rede imutavel poderia gerar riscos de privacidade e conflito com principios da LGPD.

A aplicacao mais adequada seria usar blockchain como uma camada complementar de auditoria e prova de integridade. O banco relacional continuaria armazenando os dados operacionais, enquanto a blockchain guardaria apenas evidencias tecnicas de eventos relevantes.

## Implementacao no prototipo

No prototipo, essa ideia foi implementada como uma cadeia de auditoria por hash, armazenada na tabela `protocol_audit_chain`. Cada registro funciona como um bloco: possui indice sequencial, hash do payload, hash do bloco anterior e hash final do bloco. Dessa forma, se um bloco antigo for alterado, a verificacao de integridade passa a falhar.

Os eventos registrados no prototipo sao:

- `PROTOCOL_CREATED`: criado automaticamente quando o cidadao abre uma solicitacao;
- `STATUS_CHANGED`: criado quando um servidor altera o status de atendimento;
- `AI_PRIORITY_CLASSIFIED`: criado quando a IA classifica a prioridade do protocolo;
- `PRIORITY_CHANGED`: criado quando um servidor altera manualmente a prioridade.

Na interface administrativa, o detalhe do protocolo possui uma aba chamada "Blockchain". Essa aba consulta a Edge Function `app-protocols`, carrega os blocos associados ao protocolo e mostra a verificacao de integridade da cadeia.

## Como visualizar no prototipo

Para visualizar os registros de auditoria:

1. Acessar o sistema como servidor/admin.
2. Entrar em "Fila de Solicitacoes".
3. Abrir um protocolo.
4. Clicar na aba "Blockchain".

A aba apresenta os blocos em formato de tabela paginada, exibindo:

- numero do bloco;
- tipo do evento;
- papel do ator responsavel;
- status anterior e novo status, quando aplicavel;
- hash do bloco atual;
- hash do bloco anterior;
- data e hora do registro;
- validade do bloco.

O cidadao nao visualiza essa aba, pois os hashes e metadados tecnicos sao informacoes de auditoria administrativa. Para o cidadao, o mais importante e acompanhar o andamento do protocolo de forma simples.

## Como gerar registros na blockchain

Protocolos antigos podem aparecer sem blocos, pois foram criados antes da implementacao da auditoria blockchain. Para gerar registros novos, basta executar uma acao auditada:

- criar uma nova solicitacao como cidadao, gerando `PROTOCOL_CREATED`;
- alterar o status de um protocolo como admin, gerando `STATUS_CHANGED`;
- alterar manualmente a prioridade como admin, gerando `PRIORITY_CHANGED`;
- aguardar a classificacao de prioridade pela IA, gerando `AI_PRIORITY_CLASSIFIED`.

Cada nova acao cria um bloco encadeado ao bloco anterior por meio do campo `previous_block_hash`.

## Evento critico para registro imutavel

O evento mais critico para registro imutavel seria a mudanca de status de um protocolo, principalmente quando uma solicitacao passa para "Em Analise", "Concluido" ou quando sua prioridade e alterada por um servidor publico.

Esse evento e importante porque impacta diretamente a transparencia do atendimento. Se um protocolo for encerrado indevidamente, alterado sem justificativa ou modificado depois da resposta ao cidadao, o sistema precisa permitir auditoria posterior. A existencia de uma prova imutavel aumenta a confianca no processo e dificulta adulteracoes silenciosas.

## Evidencias que poderiam ser registradas

O registro em blockchain deveria conter apenas evidencias tecnicas, como:

- identificador do protocolo;
- tipo do evento, por exemplo `STATUS_CHANGED`;
- status anterior;
- novo status;
- data e hora do evento;
- papel do responsavel, por exemplo `admin`;
- hash criptografico do evento;
- hash de documento ou imagem, quando houver necessidade de provar integridade do anexo.

Exemplo conceitual:

```json
{
  "protocol_id": "ID do protocolo",
  "event_type": "STATUS_CHANGED",
  "previous_status": "Em Analise",
  "new_status": "Concluido",
  "timestamp": "data e hora do evento",
  "actor_role": "admin",
  "event_hash": "SHA-256 dos dados do evento"
}
```

## Dados que nao devem ser registrados

Nao devem ser registrados em blockchain:

- CPF do cidadao;
- nome completo;
- telefone;
- endereco completo;
- descricao livre da solicitacao;
- imagens ou arquivos originais;
- coordenadas precisas de geolocalizacao;
- qualquer dado pessoal ou sensivel.

## Conclusao

Para o HackGov, a blockchain faria sentido como mecanismo de auditoria, integridade e transparencia, nao como substituto do banco de dados da aplicacao. O modelo mais seguro seria registrar apenas hashes e metadados minimos de eventos criticos, preservando a privacidade dos cidadaos e permitindo verificacao futura de que uma decisao administrativa nao foi adulterada.
