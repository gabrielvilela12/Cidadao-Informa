# Base de demonstração

Dados fictícios para apresentar o sistema com as telas cheias: 554 chamados em 32
cidades, com datas de hoje até mais de um ano atrás, as quatro prioridades da
triagem e concentração geográfica suficiente para o mapa de calor mostrar do azul
ao vermelho.

**Nada aqui roda sozinho.** Os arquivos ficam fora de `db/migration` e de
`supabase/migrations` de propósito: nenhum deploy os aplica. Você roda à mão, no
banco onde a apresentação vai acontecer.

## Aplicar

Pelo SQL Editor do Supabase, ou por `psql`:

```bash
psql "$SUPABASE_DB_URL" -f supabase/seed/demo-dados.sql
```

O arquivo é uma transação só, e termina com `ON CONFLICT DO NOTHING` — rodar duas
vezes não duplica nada.

As datas são gravadas como `now() - interval`, então a base continua tendo chamado
"de hoje" e "de meses atrás" independentemente de quando você aplicar.

## O que entra

| | |
|---|---|
| Chamados | 554, sendo 543 com coordenada e 11 sem |
| Cidades | 32, de São Paulo (108) a Rio Branco (2) |
| Cidadãos | 10 fictícios, `@demo.local` |
| Status | 215 Aberto, 135 Em Análise, 204 Concluído |
| Prioridade | 49 crítica, 121 alta, 192 média, 129 baixa, 63 sem triagem |
| Prazo (SLA) | 184 em dia, 26 a vencer, 140 vencidos, 204 concluídos |
| Categoria | 275 Física, 121 Visual, 84 Auditiva, 74 Outros |

Três decisões que valem saber, porque afetam o que você vai ver na tela:

- **Os 11 sem coordenada são intencionais.** Servem para mostrar o que o sistema
  faz com eles: ficam fora do mapa e aparecem contados na legenda do calor, em vez
  de receberem uma posição inventada.
- **Nenhum chamado tem status `Atrasado`.** Não é esquecimento: nenhum fluxo do
  sistema grava esse valor. O atraso é derivado de `created_at` contra o prazo da
  prioridade, em `src/utils/sla.ts`. É por isso que a base tem chamado velho e
  aberto — é ele que faz o "Em atraso" do painel sair de zero.
- **Chamado antigo em geral está concluído.** Sem essa correlação, metade da base
  ficava vencida e o painel abria com 50% de atraso, o que se lê como sistema
  quebrado em vez de fila real.

## Os cidadãos fictícios não fazem login

O `password_hash` deles é um valor inválido de propósito — o BCrypt não casa com
ele. Base de demonstração não precisa distribuir credencial que funciona.

Apresente com a sua conta. Se ainda não tem um admin, registre-se pela tela de
cadastro e promova:

```sql
UPDATE users SET role = 'admin' WHERE lower(email) = lower('seu@email.com');
```

## Encher as telas do cidadão

O painel do admin já mostra a base inteira. As telas do cidadão filtram por
usuário do token, então "Meus Protocolos" abre vazio com a sua conta. Para passar
9 chamados recentes para você, troque o e-mail no topo de `demo-adotar.sql` e rode:

```bash
psql "$SUPABASE_DB_URL" -f supabase/seed/demo-adotar.sql
```

Se o e-mail não existir, o UPDATE não altera nada e não dá erro.

## Roteiro sugerido

1. **Dashboard Executivo** — volume, distribuição por status e o contador de
   atraso saindo de zero.
2. **Fila de Solicitações** — 56 páginas de 10; filtre por prioridade crítica e
   mostre os badges da triagem por IA.
3. **Mapa Estratégico, modo Pins** — 543 marcadores pelo país, agrupados por
   proximidade.
4. **Mapa Estratégico, modo Calor** — abra no gradiente, dê zoom em São Paulo (três
   focos vermelhos), mexa no raio e na opacidade, e troque para Grade para mostrar
   a contagem exata por área. A legenda informa quantos chamados o vermelho
   representa e quantos ficaram fora por falta de coordenada.
5. **Relatórios** — conformidade de SLA sobre uma base que de fato tem prazo
   vencido.
6. **Nova Solicitação** — crie um chamado ao vivo com a sua conta, para mostrar o
   fluxo do cidadão e a triagem automática de prioridade.

## Remover depois

```bash
psql "$SUPABASE_DB_URL" -f supabase/seed/demo-remover.sql
```

Apaga só o que o seed criou, pelos ids exatos — não existe `DELETE FROM protocols`
sem `WHERE` em nenhum lugar aqui. Chamado real de cidadão não sai junto com dado
de vitrine.

Se você rodou `demo-adotar.sql`, os 9 chamados adotados também são removidos: a
adoção troca o dono, não o id.

## Regerar

```bash
npx tsx supabase/seed/gerar-demo.ts
```

Reescreve os três `.sql`. O gerador é determinístico (PRNG com semente fixa), então
o resultado é idêntico a cada execução — mudou o arquivo, foi porque você mudou o
gerador.

Antes de escrever, ele confere o próprio resultado: calcula o estado de prazo de
cada chamado com o `src/utils/sla.ts` do projeto e falha se algum dos quatro
estados ficar sem representante; reporta a densidade que o mapa de calor vai
encontrar; e varre cada linha de `VALUES` conferindo contagem de campos e aspas
balanceadas.
