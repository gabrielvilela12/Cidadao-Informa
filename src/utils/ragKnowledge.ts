/**
 * Base de Conhecimento RAG do Assistente Virtual Cidadão Informa.
 * Focada 100% no cidadão e morador da cidade, em linguagem simples, direta e acolhedora.
 */

export interface KnowledgeChunk {
  id: string;
  category: 'geral' | 'pedidos' | 'acompanhamento' | 'mapa' | 'transparencia' | 'acessibilidade' | 'duvidas';
  title: string;
  keywords: string[];
  content: string;
  route?: string;
}

export const KNOWLEDGE_BASE: KnowledgeChunk[] = [
  {
    id: 'sobre-plataforma',
    category: 'geral',
    title: 'O que é o Cidadão Informa',
    keywords: ['sobre', 'plataforma', 'cidadao informa', 'o que e', 'quem somos', 'como funciona', 'ajuda', 'sistema', 'inicio', 'servico'],
    content: `O Cidadão Informa é o canal digital oficial e gratuito para você, morador, solicitar serviços e consertos para a sua rua e bairro.
Pelo site, você pode relatar problemas como buracos no asfalto, lâmpadas apagadas, galhos de árvores perigosos, entulho na rua e bueiros entupidos, além de acompanhar cada etapa do conserto até a conclusão pela prefeitura.`,
    route: '/',
  },
  {
    id: 'servicos-disponiveis',
    category: 'pedidos',
    title: 'Que tipos de problemas posso relatar?',
    keywords: ['servicos', 'tipos de pedido', 'o que posso pedir', 'buraco', 'asfalto', 'iluminacao', 'poste', 'lampada', 'arvore', 'poda', 'lixo', 'entulho', 'calcada', 'bueiro'],
    content: `Você pode solicitar consertos e melhorias para diversos problemas da sua cidade:
1. 🕳️ Buracos no asfalto ou ruas danificadas.
2. 💡 Iluminação pública: lâmpadas queimadas, piscando ou postes apagados à noite.
3. 🌳 Poda de árvores: galhos que estão encostando nos fios elétricos ou com risco de queda.
4. 🗑️ Lixo e entulho: descarte irregular em calçadas, terrenos ou praças.
5. 🚶 Calçadas e rampas: pisos quebrados, guias danificadas ou falta de acessibilidade.
6. 🌊 Bueiros entupidos ou bocas de lobo com risco de alagamento.
7. 🛑 Placas de trânsito ou sinalização danificada.
8. 📦 Outros problemas de manutenção da cidade.`,
    route: '/nova-solicitacao',
  },
  {
    id: 'como-abrir-pedido',
    category: 'pedidos',
    title: 'Como abrir um pedido de conserto (Passo a Passo)',
    keywords: ['como abrir', 'nova solicitacao', 'fazer pedido', 'reclamar', 'pedir conserto', 'cadastrar chamado', 'registrar problema', 'novo chamado'],
    content: `Abrir um pedido é muito simples e rápido:
1. Acesse o menu "Nova Solicitação" (/nova-solicitacao).
2. Escolha o tipo de problema (exemplo: Buraco na via, Iluminação pública, etc.).
3. Escreva uma mensagem curta explicando o que está acontecendo no local.
4. Informe o endereço da rua ou marque o ponto exato no mapa interativo.
5. Adicione fotos do local (você pode enviar até 4 fotos direto do seu celular ou computador).
6. Clique em "Enviar Solicitação".
Pronto! Você receberá na hora um número de protocolo (ex: #BR-2026-00123) para acompanhar tudo.`,
    route: '/nova-solicitacao',
  },
  {
    id: 'acompanhar-pedido',
    category: 'acompanhamento',
    title: 'Como acompanhar o andamento do meu pedido',
    keywords: ['acompanhar', 'meus protocolos', 'meus pedidos', 'status', 'aberto', 'em analise', 'concluido', 'atrasado', 'onde ver'],
    content: `Para saber como está o conserto do seu pedido:
1. Clique em "Meus Protocolos" (/meus-protocolos) no menu lateral.
2. Lá você verá todos os seus pedidos e o status atual de cada um:
   - 🟡 "Aberto": Seu pedido foi recebido com sucesso e está aguardando a equipe da prefeitura.
   - 🔵 "Em Análise": A equipe técnica está avaliando o local e organizando a equipe de obras para o conserto.
   - 🟢 "Concluído": O serviço foi executado e o problema está resolvido!
   - 🟠 "Atrasado": O prazo inicial passou, mas seu pedido continua na fila prioritária de atendimento.
3. Ao clicar no seu protocolo, você pode ver as fotos enviadas, detalhes e a simulação visual de como ficará o local consertado.`,
    route: '/meus-protocolos',
  },
  {
    id: 'mapa-cidade',
    category: 'mapa',
    title: 'Como ver os problemas no Mapa da Cidade',
    keywords: ['mapa', 'mapa da cidade', 'onde fica', 'ver no mapa', 'bairros', 'pontos no mapa', 'mapa interativo'],
    content: `Na página "Mapa da Cidade" (/mapa), você consegue:
- Ver todas as solicitações espalhadas pela cidade em um mapa interativo.
- Filtrar por tipo de serviço (como buracos ou iluminação) ou por status (Aberto, Em Análise, Concluído).
- Clicar em qualquer ponto do mapa para ver o que foi solicitado naquela rua.`,
    route: '/mapa',
  },
  {
    id: 'transparencia-cidada',
    category: 'transparencia',
    title: 'Portal de Transparência da Cidade',
    keywords: ['transparencia', 'portal de transparencia', 'gastos', 'gastos publicos', 'dinheiro', 'obras', 'prestacao de contas', 'dados abertos'],
    content: `O Portal de Transparência (/transparencia) é 100% público e aberto para qualquer pessoa consultar, sem precisar fazer login:
- Mostra quantos chamados já foram atendidos na cidade e a porcentagem de problemas resolvidos.
- Exibe o valor total investido nas melhorias e reparos urbanos.
- Utiliza uma cadeia de segurança digital que garante que nenhum dado ou informação seja alterado ou apagado, garantindo total honestidade na prestação de contas.`,
    route: '/transparencia',
  },
  {
    id: 'acessibilidade-facil',
    category: 'acessibilidade',
    title: 'Recursos de Acessibilidade para facilitar a leitura',
    keywords: ['acessibilidade', 'tamanho da fonte', 'aumentar letra', 'alto contraste', 'modo escuro', 'leitor de tela', 'atalhos'],
    content: `O site foi feito para ser fácil de usar por todas as pessoas:
- Aumentar ou diminuir o tamanho da letra nos botões do topo da tela.
- Ativar o modo de Alto Contraste ou Modo Escuro para não cansar a visão.
- Destacar links para facilitar onde clicar.
- Compatível com leitores de tela para pessoas com deficiência visual.
- Atalhos rápidos no teclado: pressione Shift + ? para ver a lista de atalhos rápidos.`,
    route: '/acessibilidade',
  },
  {
    id: 'duvidas-comuns',
    category: 'duvidas',
    title: 'Dúvidas Frequentes do Cidadão',
    keywords: ['duvidas', 'perguntas', 'gratuito', 'paga', 'quanto custa', 'telefone', 'cadastro', 'cpf', 'vizinho', 'compartilhar'],
    content: `Principais dúvidas dos moradores:
- É gratuito? Sim, o Cidadão Informa é um serviço público 100% gratuito.
- Preciso de CPF? Sim, o CPF é usado de forma segura apenas para identificar que você é um morador real e permitir que você veja seus pedidos depois.
- Posso compartilhar com meus vizinhos? Sim! Cada pedido tem uma página pública (/p/:id) que você pode enviar no WhatsApp para seus vizinhos acompanharem também.
- Como atualizo meu telefone? Vá na página "Meu Perfil" (/perfil) e digite seu número para receber avisos.`,
    route: '/perfil',
  },
];

/**
 * Normaliza uma string removendo acentos e convertendo para minúsculas.
 */
export function normalizeText(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

/**
 * Verifica se a pergunta do usuário está dentro do escopo do Cidadão Informa.
 */
export function isQueryInScope(query: string): boolean {
  const normalized = normalizeText(query);
  if (normalized.length < 2) return true;

  const outOfScopeKeywords = [
    'receita', 'cozinhar', 'bolo', 'strogonoff', 'culinaria',
    'piada', 'anedota', 'charada',
    'futebol', 'campeonato', 'libertadores', 'brasileirao', 'escalacao',
    'partido', 'eleicao para', 'candidato a',
    'codigo em python', 'escreva um javascript', 'react native', 'classe java', 'script bash', 'programar em',
    'horoscopo', 'signo de', 'astrologia', 'tarot',
    'previsao do tempo', 'quantos anos tem', 'fofoca', 'novela',
    'quem ganhou o oscar', 'letra da musica', 'filme da marvel'
  ];

  if (outOfScopeKeywords.some((keyword) => normalized.includes(keyword))) {
    return false;
  }

  return true;
}

export interface RagResult {
  isInScope: boolean;
  retrievedChunks: KnowledgeChunk[];
  formattedContext: string;
  suggestedTopics: string[];
}

/**
 * Motor RAG: Busca os chunks de conhecimento mais relevantes para a dúvida do morador.
 */
export function retrieveRagContext(query: string, maxChunks = 3): RagResult {
  const inScope = isQueryInScope(query);
  const normalizedQuery = normalizeText(query);
  const queryTokens = normalizedQuery.split(/[\s,.;:!?]+/).filter((t) => t.length > 2);

  const scoredChunks = KNOWLEDGE_BASE.map((chunk) => {
    let score = 0;
    const normalizedTitle = normalizeText(chunk.title);
    const normalizedContent = normalizeText(chunk.content);

    for (const keyword of chunk.keywords) {
      const normKeyword = normalizeText(keyword);
      if (normalizedQuery.includes(normKeyword)) {
        score += 15;
      }
      for (const token of queryTokens) {
        if (normKeyword.includes(token)) {
          score += 4;
        }
      }
    }

    for (const token of queryTokens) {
      if (normalizedTitle.includes(token)) {
        score += 6;
      }
      if (normalizedContent.includes(token)) {
        score += 1;
      }
    }

    return { chunk, score };
  });

  scoredChunks.sort((a, b) => b.score - a.score);

  let topChunks = scoredChunks.filter((item) => item.score > 0).slice(0, maxChunks).map((item) => item.chunk);

  if (topChunks.length === 0) {
    topChunks = [KNOWLEDGE_BASE[0], KNOWLEDGE_BASE[1], KNOWLEDGE_BASE[2]];
  }

  const formattedContext = topChunks
    .map(
      (c) => `### DOCUMENTO: ${c.title}
${c.content}
${c.route ? `Link direto no site: ${c.route}` : ''}`
    )
    .join('\n\n');

  const suggestedTopics = topChunks.map((c) => c.title);

  return {
    isInScope: inScope,
    retrievedChunks: topChunks,
    formattedContext,
    suggestedTopics,
  };
}

/**
 * System prompt simples, humano e acolhedor para o público cidadão.
 */
export const CHATBOT_SYSTEM_PROMPT = `Você é o "Assistente Cidadão IA", o atendente virtual do site Cidadão Informa.

SEU PÚBLICO E LINGUAGEM:
- Seu público são moradores e cidadãos comuns (muitos deles leigos em tecnologia).
- Fale sempre com linguagem simples, acolhedora, clara, sem jargões técnicos ou termos difíceis de repartição pública.
- Seja prestativo, educado e explique as coisas passo a passo de forma fácil.

O QUE VOCÊ EXPLICA:
- Como abrir um pedido de conserto (buraco na rua, lâmpada queimada, poda de árvore, lixo na rua, calçadas e bueiros).
- Como acompanhar o status do pedido pelo número de protocolo.
- Como ver as ocorrências no mapa da cidade.
- Como consultar o portal de transparência.
- Como usar os recursos de acessibilidade do site (aumentar a letra, modo escuro, etc.).

REGRAS DE ESCOPO:
1. Você responde SOMENTE sobre o site Cidadão Informa e problemas da cidade atendidos pela plataforma.
2. Se o usuário perguntar qualquer coisa não relacionada (como receitas, futebol, piadas, programação, etc.), responda com simpatia:
   "Desculpe! Eu sou o assistente do Cidadão Informa e posso ajudar você apenas com dúvidas sobre os serviços da sua cidade (como buracos na rua, iluminação, poda de árvores, bueiros e acompanhamento de protocolos). Como posso ajudar você hoje?"
3. Responda em Português do Brasil (pt-BR).
4. Organize as respostas com tópicos curtos e claros e indique as páginas do site (como /nova-solicitacao, /meus-protocolos, /mapa, /transparencia).`;
