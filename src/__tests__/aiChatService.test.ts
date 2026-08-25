import { describe, it, expect } from 'vitest';
import { aiChatService } from '../services/aiChatService';

describe('aiChatService', () => {
  it('deve rejeitar mensagens vazias com erro explicativo', async () => {
    await expect(aiChatService.sendMessage('   ')).rejects.toThrow('A mensagem não pode ser vazia.');
  });

  it('deve responder com recusa educada para consultas fora do escopo', async () => {
    const response = await aiChatService.sendMessage('Como fazer uma receita de lasanha?');
    expect(response.reply).toContain('Assistente Virtual do Cidadão Informa');
    expect(response.reply).toContain('serviços');
  });

  it('deve responder a dúvidas sobre como pedir consertos', async () => {
    const response = await aiChatService.sendMessage('Como posso pedir um conserto de buraco na rua?');
    expect(response.reply).toContain('conserto');
    expect(response.topics.length).toBeGreaterThan(0);
  });

  it('deve fornecer informações sobre o portal de transparência', async () => {
    const response = await aiChatService.sendMessage('Onde vejo os gastos públicos e a transparência?');
    expect(response.reply).toContain('Transparência');
  });
});
