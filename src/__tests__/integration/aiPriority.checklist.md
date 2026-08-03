# Checklist manual — triagem de prioridade por IA

Era um arquivo `.test.ts` com `expect(true).toBe(true)` em cada caso. Virou
markdown quando o projeto ganhou test runner (Vitest): mantido como `.test.ts`, ele
reportaria sete testes verdes que não verificam nada, e confiança falsa é pior que
ausência de teste. O conteúdo é um roteiro de verificação manual, e é isso que
está aqui.

## Pré-requisitos

- Backend rodando em `localhost:8080`
- Edge Functions do Supabase publicadas ou rodando local
- Chave da OpenRouter configurada no `.env`
- Frontend em `localhost:5173`

Execute na ordem.

## 1. Cidadão abre solicitação e recebe protocolo na hora

1. Entre como cidadão
2. Clique em "Nova Solicitação"
3. Preencha categoria, descrição e localização
4. Clique em "Enviar"

**Esperado:** o número do protocolo aparece em menos de 1 segundo — o cidadão não
espera a IA.

## 2. Admin vê a prioridade na fila em até 10 segundos

1. Entre como admin
2. Vá em "Fila de Solicitações"
3. Localize o protocolo do passo 1

**Esperado:** o selo de prioridade aparece (🔴 CRÍTICA, 🟠 ALTA, 🟡 MÉDIA ou
🟢 BAIXA), com a cor correspondente à severidade.

## 3. Admin sobrepõe a prioridade à mão

1. No detalhe do protocolo, clique em "Trocar"
2. Escolha outra prioridade (se estava ALTA, escolha BAIXA)
3. Informe o motivo: "falso alarme"
4. Clique em "Salvar"

**Esperado:** a prioridade muda na hora, o modal fecha e o motivo aparece na
trilha de auditoria.

## 4. Falha na classificação aparece sem quebrar a tela

1. Desative temporariamente a Edge Function ou a chave da API
2. Crie uma solicitação
3. Aguarde 10 segundos
4. Vá para a fila do admin

**Esperado:** o selo mostra ⚠️ "IA Falhou", e o admin consegue definir a
prioridade manualmente.

## 5. Logs de IA registram todas as mudanças

1. Vá em Admin → Logs IA
2. Procure o protocolo do passo 4

**Esperado:** uma entrada da classificação automática (origem 🤖 IA), uma da
sobreposição manual (origem 👤 Admin Manual), e o campo de motivo preenchido.

## 6. Reprocessamento automático (avançado)

1. Crie uma solicitação com a Edge Function fora do ar
2. Aguarde 5 minutos ou mais, para o `pg_cron` tentar de novo

**Esperado:** o job sai de falha para sucesso, a prioridade aparece na fila do
admin, e a auditoria registra a nova tentativa.

## 7. Desempenho — prioridade visível em até 10 segundos

1. Crie 5 solicitações em sequência rápida
2. Vá para a fila do admin
3. Meça o tempo até todas as prioridades aparecerem

**Esperado:** todas visíveis em até 10 segundos, sem travamento da interface.
