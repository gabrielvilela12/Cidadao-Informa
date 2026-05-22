---
tags: [type/playbook, domain/ai-standards, process/skills]
aliases: [Skills, Papeis IA, Playbook de Skills]
---

# Skill Playbook

> Papeis recomendados para orientar prompts e revisoes com IA.

Use estes papeis como "skills" de trabalho. Eles nao sao cargos fixos; sao lentes para melhorar a qualidade da resposta.

## 1. Product Maintainer

**Quando usar:** novas funcionalidades, priorizacao de backlog, entrega FIAP, narrativa de projeto.  
**Responsabilidade:** manter coerencia entre problema publico, proposta de valor e implementacao.

**Checklist:**

- O fluxo melhora a vida do cidadao ou do servidor?
- A funcionalidade tem criterio de aceite claro?
- A entrega evidencia Ciencia de Dados, IA, seguranca ou acessibilidade?

## 2. Frontend Institucional Specialist

**Quando usar:** telas React, layout, responsividade, identidade visual, acessibilidade.  
**Responsabilidade:** manter padrao institucional, contraste, navegacao previsivel e consistencia visual.

**Checklist:**

- Azul institucional e a cor primaria.
- Verde/amarelo aparecem como acentos, nao como tema dominante.
- Vermelho e usado apenas para risco, erro ou atraso.
- Textos cabem no container em mobile e desktop.
- Componentes interativos tem hover, foco e estado desabilitado.

## 3. Backend Spring Maintainer

**Quando usar:** `backend-java`, API, autenticacao, entidades, repositorios e migrations.  
**Responsabilidade:** manter camadas limpas, validacoes de dominio e seguranca.

**Checklist:**

- Controller nao concentra regra de negocio.
- Use case valida entrada e aplica regra.
- Repository encapsula persistencia.
- Migrations Flyway sao versionadas e reversiveis por nova migration.
- Endpoints sensiveis exigem autenticacao.

## 4. Data and AI Analyst

**Quando usar:** dashboard, relatorios, insights inteligentes, score, IA generativa, metricas.  
**Responsabilidade:** transformar protocolos em indicadores explicaveis.

**Checklist:**

- Indicador tem definicao clara.
- Score mostra justificativa.
- IA nao toma decisao administrativa final sozinha.
- Dados pessoais nao sao enviados para API externa sem necessidade.
- Metricas conseguem ser explicadas em pitch.

## 5. Security and LGPD Reviewer

**Quando usar:** auth, perfil, dados pessoais, links publicos, exportacao, logs.  
**Responsabilidade:** proteger dados do cidadao.

**Checklist:**

- CPF, telefone e email nao aparecem em tela publica.
- Senha nunca e logada nem salva em texto puro.
- Tokens nao sao enviados para terceiros.
- Exports contem apenas campos necessarios.
- Erros nao revelam estrutura interna do sistema.

## 6. QA and Release Reviewer

**Quando usar:** antes de merge, entrega FIAP, deploy ou demonstracao.  
**Responsabilidade:** encontrar regressao antes do usuario.

**Checklist:**

- Login/cadastro.
- Dashboard cidadao.
- Nova solicitacao.
- Meus protocolos.
- Dashboard admin.
- Relatorios/exportacao.
- Mapa.
- Responsividade mobile.
