import { describe, it, expect } from 'vitest';
import { aiChatService } from '../services/aiChatService';

describe('aiChatService', () => {
  it('deve rejeitar mensagens vazias com erro explicativo', async () => {
    await expect(aiChatService.sendMessage('   ')).rejects.toThrow('A mensagem não pode ser vazia.');
  });

  it('deve responder com recusa educada para consultas fora do escopo', async () => {
    const response = await aiChatService.sendMessage('Como fazer uma receita de lasanha?');
    expect(response.reply).toContain('Assistente Virtual do Cidadão Informa');
    expect(response.reply).toContain('programado para tirar dúvidas exclusivamente sobre a nossa plataforma');
    expect(response.topics).toContain('Fora de Escopo');
  });

  it('deve responder saudações com visão geral da plataforma', async () => {
    const response = await aiChatService.sendMessage('Olá!');
    expect(response.reply).toContain('Cidadão Informa');
    expect(response.reply).toContain('Gemini 3.7 Flash');
    expect(response.reply).toContain('Nova Solicitação');
  });

  it('deve fornecer orientação sobre como abrir chamados', async () => {
    const response = await aiChatService.sendMessage('Como posso abrir um chamado de buraco na rua?');
    expect(response.reply).toContain('Nova Solicitação');
    expect(response.topics.length).toBeGreaterThan(0);
  });

  it('deve fornecer informações sobre o portal de transparência', async () => {
    const response = await aiChatService.sendMessage('Onde vejo os gastos públicos e a transparência?');
    expect(response.reply).toContain('Transparência');
  });
});
