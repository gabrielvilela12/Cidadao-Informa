import { describe, it, expect } from 'vitest';
import {
  retrieveRagContext,
  isQueryInScope,
  normalizeText,
  KNOWLEDGE_BASE,
  CHATBOT_SYSTEM_PROMPT,
} from '../utils/ragKnowledge';

describe('RAG Knowledge Base & Engine (Foco no Cidadão)', () => {
  it('deve possuir a base de conhecimento estruturada e não vazia', () => {
    expect(KNOWLEDGE_BASE.length).toBeGreaterThan(5);
    for (const chunk of KNOWLEDGE_BASE) {
      expect(chunk.id).toBeTruthy();
      expect(chunk.title).toBeTruthy();
      expect(chunk.content.length).toBeGreaterThan(20);
      expect(chunk.keywords.length).toBeGreaterThan(2);
    }
  });

  it('deve normalizar textos removendo acentos e pontuações', () => {
    expect(normalizeText('Cidadão Informa')).toBe('cidadao informa');
    expect(normalizeText('Iluminação Pública')).toBe('iluminacao publica');
    expect(normalizeText('  AUDITORIA   ')).toBe('auditoria');
  });

  it('deve identificar consultas dentro do escopo do Cidadão Informa', () => {
    expect(isQueryInScope('Como abrir um protocolo de buraco na rua?')).toBe(true);
    expect(isQueryInScope('Onde vejo o mapa da minha cidade?')).toBe(true);
    expect(isQueryInScope('Como acompanhar meu pedido de conserto?')).toBe(true);
    expect(isQueryInScope('Quais atalhos de acessibilidade existem?')).toBe(true);
    expect(isQueryInScope('Olá, preciso de ajuda')).toBe(true);
  });

  it('deve identificar e bloquear consultas fora do escopo (guardrails)', () => {
    expect(isQueryInScope('Me passa uma receita de bolo de chocolate')).toBe(false);
    expect(isQueryInScope('Conte uma piada engraçada')).toBe(false);
    expect(isQueryInScope('Quem ganhou o jogo de futebol ontem?')).toBe(false);
    expect(isQueryInScope('Escreva um codigo em python para ordenar um array')).toBe(false);
    expect(isQueryInScope('Qual o meu horoscopo de hoje?')).toBe(false);
  });

  it('deve recuperar chunks relevantes para dúvidas sobre abertura de pedidos', () => {
    const result = retrieveRagContext('Como cadastrar um novo pedido de conserto de buraco no asfalto?');
    expect(result.isInScope).toBe(true);
    expect(result.retrievedChunks.length).toBeGreaterThan(0);
    const hasPedidoOrServico = result.retrievedChunks.some(
      (c) => c.id === 'como-abrir-pedido' || c.id === 'servicos-disponiveis'
    );
    expect(hasPedidoOrServico).toBe(true);
  });

  it('deve recuperar chunks relevantes para dúvidas sobre transparência pública', () => {
    const result = retrieveRagContext('Onde posso ver os gastos e a transparência da cidade?');
    expect(result.isInScope).toBe(true);
    const hasTransparencia = result.retrievedChunks.some((c) => c.id === 'transparencia-cidada');
    expect(hasTransparencia).toBe(true);
    expect(result.formattedContext).toContain('Transparência');
  });

  it('deve conter as orientações cidadãs e guardrails no prompt do sistema', () => {
    expect(CHATBOT_SYSTEM_PROMPT).toContain('Cidadão Informa');
    expect(CHATBOT_SYSTEM_PROMPT).toContain('linguagem simples');
    expect(CHATBOT_SYSTEM_PROMPT).toContain('REGRAS DE ESCOPO');
  });
});
