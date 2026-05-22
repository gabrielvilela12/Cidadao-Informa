---
tags: [type/guide, domain/frontend, design/INSTITUCIONAL]
aliases: [Padrao Institucional, UI Standard, Design Institucional]
---

# UI Institutional Standard

> Padrao visual para manter o Cidadao Informa com cara de servico publico digital.

## Paleta

| Uso | Cor | Hex |
|---|---|---|
| Primaria | Azul institucional | `#1351B4` |
| Primaria escura | Azul institucional escuro | `#0C326F` |
| Sucesso | Verde institucional | `#168821` |
| Atencao | Amarelo institucional | `#FFCD07` |
| Erro/risco | Vermelho institucional | `#E52207` |
| Fundo | Cinza claro institucional | `#F7F9FC` |
| Superficie | Branco | `#FFFFFF` |
| Texto principal | Quase preto | `#1D1D1B` |

## Regras de Uso

- Azul e a cor principal de navegacao, CTA e links.
- Verde indica sucesso, conclusao ou status positivo.
- Amarelo indica atencao, analise ou pendencia.
- Vermelho indica erro, atraso, risco ou acao destrutiva.
- Evitar roxo, ciano neon, gradientes decorativos e fundos escuros dominantes.
- Cards devem ter fundo branco, borda suave e sombra discreta.
- Evitar decoracao que invada texto ou botao.

## Componentes

### Botoes

- Primario: fundo azul, texto branco.
- Secundario: fundo branco, borda cinza, texto escuro.
- Atencao: amarelo, texto escuro.
- Destrutivo: vermelho, texto branco.

### Badges

- Usar fundo claro e texto forte.
- Exemplo: aberto em azul claro, em analise em amarelo claro, concluido em verde claro, atrasado em vermelho claro.

### Formularios

- Inputs brancos.
- Borda visivel.
- Foco com azul ou amarelo de acessibilidade.
- Placeholder com cinza medio.

### Dashboards

- KPIs devem ser escaneaveis.
- Graficos devem usar azul, verde, amarelo e vermelho com significado fixo.
- Evitar varias cores sem legenda.

## Cuidados Com CSS Global

- Preferir classes especificas para componentes sensiveis.
- Evitar regras globais que sobrescrevem toda cor de texto dentro de cards coloridos.
- Quando um card tiver fundo azul, definir explicitamente texto e icones brancos.
- Testar landing, login, dashboard cidadao e dashboard admin apos mudar `index.css`.

## Checklist Visual

- Texto legivel em todos os cards.
- Botoes nao perdem contraste em hover.
- Icones aparecem no fundo correto.
- Mobile nao corta textos.
- Elementos decorativos nao cobrem conteudo.
- Modo claro nao usa filtro de inversao.
