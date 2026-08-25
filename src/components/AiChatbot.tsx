import React, { useState, useRef, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Bot,
  Sparkles,
  X,
  Send,
  RotateCcw,
  Minimize2,
  Maximize2,
  ExternalLink,
  CheckCircle2,
  Info,
} from 'lucide-react';
import { aiChatService, type ChatMessage } from '../services/aiChatService';
import { useApp } from '../context/AppContext';

const INITIAL_MESSAGE: ChatMessage = {
  id: 'init-1',
  role: 'assistant',
  content:
    'Olá! Sou o **Assistente Virtual do Cidadão Informa**! 👋\n\nEstou aqui para ajudar você a resolver problemas na sua rua e no seu bairro:\n- 🛠️ **Como pedir consertos** (tapar buraco, trocar lâmpada queimada, podar árvore com perigo, limpar entulho, consertar calçada e bueiro);\n- 🔍 **Como acompanhar seu pedido** pelo número de protocolo;\n- 🗺️ **Como ver o mapa da cidade** com todos os chamados;\n- 📊 **Como consultar a transparência** das obras públicas;\n- ♿ **Como usar recursos de acessibilidade** (aumentar a letra, modo escuro).\n\nComo posso ajudar você hoje?',
  timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
  topics: ['Boas-vindas', 'Visão Geral'],
};

const QUICK_PROMPTS = [
  '🛠️ Como pedir um conserto na minha rua?',
  '🔍 Como acompanhar meu pedido?',
  '💡 Que tipos de problemas posso relatar?',
  '🗺️ Como ver o mapa da cidade?',
  '📊 Como ver a transparência das obras?',
];

export function AiChatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([INITIAL_MESSAGE]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [hasUnread, setHasUnread] = useState(false);

  const location = useLocation();
  const navigate = useNavigate();
  const { role, user } = useApp();

  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
      inputRef.current?.focus();
      setHasUnread(false);
    }
  }, [isOpen, messages]);

  // Fecha com a tecla ESC
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  const handleSendMessage = async (textToSend?: string) => {
    const messageText = (textToSend || inputMessage).trim();
    if (!messageText || isLoading) return;

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: messageText,
      timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    try {
      const response = await aiChatService.sendMessage(messageText, messages, {
        currentRoute: location.pathname,
        userRole: user ? role : 'morador',
      });

      const assistantMessage: ChatMessage = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: response.reply,
        timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
        topics: response.topics,
      };

      setMessages((prev) => [...prev, assistantMessage]);
      if (!isOpen) {
        setHasUnread(true);
      }
    } catch (error) {
      const errorMessage: ChatMessage = {
        id: `error-${Date.now()}`,
        role: 'assistant',
        content:
          'Desculpe, ocorreu um erro temporário ao processar sua pergunta. Por favor, tente novamente.',
        timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearChat = () => {
    setMessages([INITIAL_MESSAGE]);
  };

  const renderFormattedContent = (content: string) => {
    const lines = content.split('\n');

    return (
      <div className="space-y-1.5 text-sm leading-relaxed">
        {lines.map((line, lineIndex) => {
          if (!line.trim()) {
            return <div key={lineIndex} className="h-1.5" />;
          }

          const isBullet = line.trim().startsWith('- ') || line.trim().startsWith('* ') || line.trim().startsWith('• ');
          const formattedLine = isBullet ? line.trim().replace(/^[-*•]\s*/, '') : line;

          const parts: React.ReactNode[] = [];
          let remaining = formattedLine;
          let partKey = 0;

          const tokenRegex = /(\[([^\]]+)\]\(([^)]+)\)|\*\*([^*]+)\*\*|(\/[a-z0-9\-_/]+))/;

          while (remaining) {
            const match = remaining.match(tokenRegex);
            if (!match || match.index === undefined) {
              parts.push(remaining);
              break;
            }

            if (match.index > 0) {
              parts.push(remaining.substring(0, match.index));
            }

            if (match[2] && match[3]) {
              const linkText = match[2];
              const linkHref = match[3];
              const isInternal = linkHref.startsWith('/');

              parts.push(
                isInternal ? (
                  <button
                    key={`link-${partKey++}`}
                    type="button"
                    onClick={() => {
                      navigate(linkHref);
                      if (window.innerWidth < 640) setIsOpen(false);
                    }}
                    className="inline-flex items-center gap-1 font-semibold text-[#1351b4] hover:underline underline-offset-2 cursor-pointer"
                  >
                    <span>{linkText}</span>
                    <ExternalLink size={12} className="shrink-0 inline" />
                  </button>
                ) : (
                  <a
                    key={`link-${partKey++}`}
                    href={linkHref}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 font-semibold text-[#1351b4] hover:underline underline-offset-2"
                  >
                    <span>{linkText}</span>
                    <ExternalLink size={12} className="shrink-0 inline" />
                  </a>
                )
              );
            } else if (match[4]) {
              parts.push(
                <strong key={`bold-${partKey++}`} className="font-bold text-slate-900">
                  {match[4]}
                </strong>
              );
            } else if (match[5]) {
              const route = match[5];
              const isKnownRoute = [
                '/nova-solicitacao',
                '/meus-protocolos',
                '/mapa',
                '/servicos',
                '/transparencia',
                '/acessibilidade',
                '/login',
                '/cadastro',
                '/admin',
                '/admin/solicitacoes',
                '/admin/mapa',
                '/admin/relatorios',
                '/admin/ai-logs',
                '/perfil',
                '/privacidade',
                '/termos-de-uso',
              ].includes(route);

              if (isKnownRoute) {
                parts.push(
                  <button
                    key={`route-${partKey++}`}
                    type="button"
                    onClick={() => {
                      navigate(route);
                      if (window.innerWidth < 640) setIsOpen(false);
                    }}
                    className="inline-block px-1.5 py-0.5 rounded bg-blue-50 text-[#1351b4] font-medium text-xs hover:bg-blue-100 cursor-pointer transition-colors"
                  >
                    {route}
                  </button>
                );
              } else {
                parts.push(route);
              }
            }

            remaining = remaining.substring(match.index + match[0].length);
          }

          if (isBullet) {
            return (
              <div key={lineIndex} className="flex items-start gap-2 pl-2">
                <span className="text-[#1351b4] mt-1 text-xs">•</span>
                <span className="flex-1 text-slate-800">{parts}</span>
              </div>
            );
          }

          return <div key={lineIndex} className="text-slate-800">{parts}</div>;
        })}
      </div>
    );
  };

  return (
    <>
      {/* Botão Flutuante Fixo no Canto Inferior Direito com Movimento Suave */}
      {!isOpen && (
        <div className="fixed bottom-6 right-6 z-[999] print:hidden">
          <button
            type="button"
            onClick={() => setIsOpen(true)}
            aria-label="Abrir Assistente Virtual Cidadão Informa"
            title="Assistente Cidadão Informa"
            className="group relative flex items-center justify-center size-14 md:size-16 rounded-full bg-gradient-to-tr from-[#0c326f] via-[#1351b4] to-[#1d70e2] text-white shadow-2xl hover:shadow-[0_0_25px_rgba(19,81,180,0.6)] hover:scale-105 active:scale-95 transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-blue-400/50 cursor-pointer animate-gentle-float"
          >
            {/* Efeito Glow Suave */}
            <span className="absolute -inset-1 rounded-full bg-gradient-to-r from-blue-500 to-indigo-500 opacity-40 blur-sm group-hover:opacity-75 transition-opacity" />

            <div className="relative flex items-center justify-center">
              <Bot className="size-7 md:size-8 transition-transform group-hover:rotate-6 duration-300" />
              <Sparkles className="absolute -top-1 -right-1 size-4 text-amber-300 animate-pulse" />
            </div>

            {hasUnread && (
              <span className="absolute top-0 right-0 size-4 bg-red-500 border-2 border-white rounded-full animate-ping" />
            )}
          </button>
        </div>
      )}

      {/* Janela de Diálogo do Chatbot - Padrão do Sistema */}
      {isOpen && (
        <div
          role="dialog"
          aria-label="Janela do Assistente Virtual Cidadão Informa"
          className={`fixed z-[999] flex flex-col shadow-2xl transition-all duration-300 border border-slate-200 bg-white text-slate-800 font-sans print:hidden ${
            isExpanded
              ? 'bottom-4 right-4 left-4 top-4 md:left-auto md:top-auto md:w-[600px] md:h-[750px] md:max-h-[90vh] rounded-2xl'
              : 'bottom-4 right-4 left-4 sm:left-auto sm:w-[420px] sm:h-[620px] max-h-[85vh] rounded-2xl'
          }`}
        >
          {/* Header do Chat - Alto Contraste e Legibilidade Perfeita */}
          <div className="flex items-center justify-between px-4 py-3.5 bg-[#0c326f] text-white rounded-t-2xl shadow-md border-b border-blue-900 select-none">
            <div className="flex items-center gap-3">
              <div className="relative flex items-center justify-center size-10 rounded-xl bg-white/15 backdrop-blur-md border border-white/25 shadow-inner">
                <Bot className="size-6 text-white" />
                <span className="absolute -bottom-0.5 -right-0.5 size-3 bg-emerald-400 border-2 border-[#0c326f] rounded-full" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="font-bold text-sm md:text-base leading-none text-white tracking-tight">
                    Assistente Cidadão IA
                  </h2>
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-white/20 text-white uppercase tracking-wider">
                    Online
                  </span>
                </div>
                <p className="text-xs text-blue-100 font-medium mt-1">
                  Tire dúvidas sobre os serviços da sua cidade
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={handleClearChat}
                title="Reiniciar conversa"
                aria-label="Reiniciar conversa"
                className="p-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/15 transition-colors cursor-pointer"
              >
                <RotateCcw size={16} />
              </button>
              <button
                type="button"
                onClick={() => setIsExpanded(!isExpanded)}
                title={isExpanded ? 'Restaurar tamanho' : 'Expandir'}
                aria-label={isExpanded ? 'Restaurar tamanho' : 'Expandir'}
                className="hidden sm:block p-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/15 transition-colors cursor-pointer"
              >
                {isExpanded ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
              </button>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                title="Fechar chat"
                aria-label="Fechar chat"
                className="p-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/15 transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>
          </div>

          {/* Área de Mensagens com Scroll Customizado Sleek */}
          <div className="flex-1 min-h-0 overflow-y-auto p-4 space-y-4 bg-[#F7F9FC] chat-scrollbar">
            {messages.map((message) => {
              const isUser = message.role === 'user';
              return (
                <div
                  key={message.id}
                  className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}
                >
                  <div
                    className={`max-w-[88%] sm:max-w-[82%] rounded-2xl px-4 py-3 shadow-sm ${
                      isUser
                        ? 'bg-[#1351b4] text-white rounded-br-none'
                        : 'bg-white text-slate-800 border border-slate-200 rounded-bl-none'
                    }`}
                  >
                    {!isUser && (
                      <div className="flex items-center gap-1.5 mb-1.5 pb-1 border-b border-slate-100 text-[11px] font-semibold text-[#1351b4]">
                        <Sparkles size={13} className="text-amber-500" />
                        <span>Cidadão Informa IA</span>
                      </div>
                    )}

                    {renderFormattedContent(message.content)}

                    {/* Tópicos RAG recuperados */}
                    {message.topics && message.topics.length > 0 && !isUser && (
                      <div className="mt-2.5 pt-2 border-t border-slate-100 flex flex-wrap gap-1">
                        {message.topics.map((topic, i) => (
                          <span
                            key={i}
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-blue-50 text-[#1351b4] border border-blue-100"
                          >
                            <CheckCircle2 size={10} className="text-emerald-500" />
                            {topic}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  <span className="text-[10px] text-slate-600 px-2 mt-1 font-medium">
                    {message.timestamp}
                  </span>
                </div>
              );
            })}

            {/* Indicador de Digitação / Loading */}
            {isLoading && (
              <div className="flex items-start gap-2">
                <div className="bg-white border border-slate-200 rounded-2xl rounded-bl-none px-4 py-3 shadow-sm flex items-center gap-2">
                  <Bot size={16} className="text-[#1351b4] animate-bounce" />
                  <span className="text-xs text-slate-600 font-medium">
                    Assistente pensando...
                  </span>
                  <div className="flex gap-1 ml-1">
                    <span className="size-1.5 rounded-full bg-blue-500 animate-pulse" />
                    <span className="size-1.5 rounded-full bg-blue-500 animate-pulse [animation-delay:200ms]" />
                    <span className="size-1.5 rounded-full bg-blue-500 animate-pulse [animation-delay:400ms]" />
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Sugestões Rápidas (Chips) */}
          {messages.length <= 2 && !isLoading && (
            <div className="px-4 py-2 bg-white border-t border-slate-100 flex gap-1.5 overflow-x-auto chat-scrollbar">
              {QUICK_PROMPTS.map((prompt, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSendMessage(prompt)}
                  className="shrink-0 px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-blue-50 text-slate-700 text-xs font-medium border border-slate-200 hover:border-blue-300 transition-all cursor-pointer"
                >
                  {prompt}
                </button>
              ))}
            </div>
          )}

          {/* Campo de Envio de Mensagem */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="p-3 bg-white border-t border-slate-200 rounded-b-2xl"
          >
            <div className="flex items-center gap-2 bg-[#F1F5F9] rounded-xl px-3 py-1.5 border border-slate-200 focus-within:border-[#1351b4] focus-within:bg-white focus-within:ring-2 focus-within:ring-blue-100 transition-all">
              <input
                ref={inputRef}
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                placeholder="Pergunte sobre serviços, pedidos, mapa, transparência..."
                disabled={isLoading}
                className="flex-1 bg-transparent text-sm text-slate-900 placeholder:text-slate-600 focus:outline-none py-1.5"
              />
              <button
                type="submit"
                disabled={!inputMessage.trim() || isLoading}
                aria-label="Enviar mensagem"
                className={`p-2 rounded-lg transition-all ${
                  inputMessage.trim() && !isLoading
                    ? 'bg-[#1351b4] text-white hover:bg-blue-700 cursor-pointer shadow-md'
                    : 'bg-slate-200 text-slate-600 cursor-not-allowed'
                }`}
              >
                <Send size={16} />
              </button>
            </div>

            <div className="flex items-center justify-between mt-2 px-1 text-[10px] text-slate-600">
              <span className="flex items-center gap-1 font-medium">
                <Info size={11} className="text-blue-500" />
                Responde exclusivamente sobre o Cidadão Informa
              </span>
              <span className="font-semibold text-slate-600">
                Pressione Enter ↵
              </span>
            </div>
          </form>
        </div>
      )}
    </>
  );
}
