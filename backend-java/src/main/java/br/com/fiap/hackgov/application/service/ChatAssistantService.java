package br.com.fiap.hackgov.application.service;

import com.fasterxml.jackson.annotation.JsonProperty;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@Service
public class ChatAssistantService {

    private static final Logger LOGGER = LoggerFactory.getLogger(ChatAssistantService.class);
    private static final String MODEL = "google/gemini-3.7-flash";
    private static final String OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";
    private static final String DEFAULT_SYSTEM_PROMPT = "Você é o Assistente Virtual Oficial do Cidadão Informa, uma IA prestativa, acolhedora e inteligente especializada em orientar moradores sobre zeladoria urbana e serviços da cidade (como buracos no asfalto, iluminação pública, poda de árvores, descarte de lixo, calçadas, bueiros, acompanhamento de protocolos e transparência pública).\n\n"
            + "REGRAS:\n"
            + "1. Responda em Português do Brasil com linguagem simples, acolhedora e didática para moradores leigos.\n"
            + "2. Quando perguntarem sobre problemas da cidade ou pedidos, explique os passos de forma clara (rotas como /nova-solicitacao, /meus-protocolos, /mapa, /transparencia).\n"
            + "3. Quando perguntarem sobre assuntos alheios, recuse educadamente e convide o morador a tirar dúvidas sobre os problemas da sua rua ou bairro.";

    private final RestClient restClient;
    private final String chatFunctionUrl;
    private final String supabaseAnonKey;
    private final String openRouterApiKey;
    private final AiPromptService aiPromptService;

    public ChatAssistantService(
            RestClient restClient,
            @Value("${app.supabase.edge-function-url}") String priorityFunctionUrl,
            @Value("${app.supabase.chat-function-url:}") String configuredChatFunctionUrl,
            @Value("${app.supabase.anon-key}") String supabaseAnonKey,
            @Value("${OPENROUTER_API_KEY:}") String openRouterApiKey,
            AiPromptService aiPromptService
    ) {
        this.restClient = restClient;
        this.chatFunctionUrl = resolveChatFunctionUrl(priorityFunctionUrl, configuredChatFunctionUrl);
        this.supabaseAnonKey = supabaseAnonKey;
        this.openRouterApiKey = openRouterApiKey;
        this.aiPromptService = aiPromptService;
    }

    public ChatResponse sendChatMessage(ChatRequest request) {
        if (request == null || request.message() == null || request.message().isBlank()) {
            throw new IllegalArgumentException("A mensagem não pode ser vazia.");
        }

        // 1. Tenta chamar a Edge Function do Supabase (onde estão os segredos da nuvem)
        if (chatFunctionUrl != null && !chatFunctionUrl.isBlank()) {
            try {
                ChatResponse response = restClient.post()
                        .uri(chatFunctionUrl)
                        .header("apikey", supabaseAnonKey)
                        .header(HttpHeaders.AUTHORIZATION, "Bearer " + supabaseAnonKey)
                        .contentType(MediaType.APPLICATION_JSON)
                        .body(request)
                        .retrieve()
                        .body(ChatResponse.class);

                if (response != null && response.reply() != null && !response.reply().isBlank()) {
                    return response;
                }
            } catch (Exception exception) {
                LOGGER.warn("Falha ao consultar Edge Function de Chat ({}), tentando chamada direta: {}", chatFunctionUrl, exception.getMessage());
            }
        }

        // 2. Tenta chamada direta ao OpenRouter com Gemini 3.7 Flash se houver chave configurada no servidor Java
        if (openRouterApiKey != null && !openRouterApiKey.isBlank()) {
            try {
                String reply = callOpenRouterDirect(request);
                if (reply != null && !reply.isBlank()) {
                    return new ChatResponse(true, reply, MODEL, List.of("Atendimento com IA"), null);
                }
            } catch (Exception exception) {
                LOGGER.warn("Falha ao consultar OpenRouter direto: {}", exception.getMessage());
            }
        }

        // 3. Fallback dinâmico contextualizado
        return buildLocalResponse(request.message());
    }

    private String callOpenRouterDirect(ChatRequest request) {
        String systemPrompt = aiPromptService.getPromptOrDefault("chatbot", DEFAULT_SYSTEM_PROMPT);

        List<Map<String, String>> messages = new ArrayList<>();
        messages.add(Map.of("role", "system", "content", systemPrompt));

        if (request.history() != null) {
            for (ChatMessageDto msg : request.history()) {
                if (msg != null && msg.content() != null && !msg.content().isBlank()) {
                    messages.add(Map.of(
                            "role", "assistant".equalsIgnoreCase(msg.role()) ? "assistant" : "user",
                            "content", msg.content()
                    ));
                }
            }
        }

        messages.add(Map.of("role", "user", "content", request.message()));

        Map<String, Object> body = Map.of(
                "model", MODEL,
                "temperature", 0.35,
                "max_tokens", 800,
                "messages", messages
        );

        OpenRouterResponse response = restClient.post()
                .uri(OPENROUTER_URL)
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + openRouterApiKey.trim())
                .header("HTTP-Referer", "https://cidadaoinforma.app")
                .header("X-Title", "Cidadao Informa - Assistente Virtual")
                .contentType(MediaType.APPLICATION_JSON)
                .body(body)
                .retrieve()
                .body(OpenRouterResponse.class);

        if (response != null && response.choices() != null && !response.choices().isEmpty()) {
            return response.choices().get(0).message().content();
        }

        return null;
    }

    private ChatResponse buildLocalResponse(String userMessage) {
        String lower = userMessage.toLowerCase();
        String reply;
        List<String> topics;

        if (lower.contains("buraco") || lower.contains("asfalto") || lower.contains("abrir") || lower.contains("solicita") || lower.contains("chamado") || lower.contains("pedir")) {
            reply = "Para pedir um conserto para a sua rua (como buraco no asfalto, poste apagado ou árvore perigosa):\n\n"
                    + "1. Acesse **/nova-solicitacao** no menu;\n"
                    + "2. Escolha o tipo de problema e explique onde fica;\n"
                    + "3. Envie fotos do local se puder;\n"
                    + "4. Clique em enviar para receber seu número de protocolo na hora!";
            topics = List.of("Como fazer um pedido", "Serviços da cidade");
        } else if (lower.contains("transparencia") || lower.contains("gastos") || lower.contains("obras") || lower.contains("dinheiro")) {
            reply = "No **Portal de Transparência** (/transparencia) você pode conferir:\n\n"
                    + "- O total de pedidos já resolvidos na cidade;\n"
                    + "- Os valores investidos em obras e manutenção pública;\n"
                    + "- A prestação de contas 100% aberta para qualquer morador.";
            topics = List.of("Portal de Transparência", "Prestação de Contas");
        } else if (lower.contains("acompanhar") || lower.contains("status") || lower.contains("protocolo") || lower.contains("meu pedido")) {
            reply = "Para acompanhar o andamento do seu pedido, vá em **/meus-protocolos**:\n\n"
                    + "- 🟡 **Aberto**: A prefeitura recebeu seu pedido;\n"
                    + "- 🔵 **Em Análise**: A equipe está organizando o conserto;\n"
                    + "- 🟢 **Concluído**: Problema resolvido com sucesso;\n"
                    + "- 🟠 **Atrasado**: Continua na fila para atendimento prioritário.";
            topics = List.of("Acompanhar Pedidos", "Status do Pedido");
        } else {
            reply = "Olá! Sou o **Assistente Virtual do Cidadão Informa**! 👋\n\n"
                    + "Estou aqui para ajudar você a resolver problemas na sua rua:\n"
                    + "- 🛠️ Pedir consertos (tapar buraco, trocar lâmpada, podar árvore, limpar entulho e bueiro);\n"
                    + "- 🔍 Acompanhar o andamento do seu pedido;\n"
                    + "- 🗺️ Ver as ocorrências no mapa da cidade;\n"
                    + "- 📊 Consultar a transparência das obras.\n\n"
                    + "Como posso ajudar você hoje?";
            topics = List.of("Ajuda ao Cidadão", "Serviços da Cidade");
        }

        return new ChatResponse(true, reply, MODEL, topics, null);
    }

    private static String resolveChatFunctionUrl(String priorityFunctionUrl, String configuredUrl) {
        if (configuredUrl != null && !configuredUrl.isBlank()) {
            return configuredUrl.trim();
        }
        if (priorityFunctionUrl == null || priorityFunctionUrl.isBlank()) {
            return "";
        }
        int lastSlash = priorityFunctionUrl.lastIndexOf('/');
        if (lastSlash < 0) return "";
        return priorityFunctionUrl.substring(0, lastSlash + 1) + "chat-assistant";
    }

    public record ChatRequest(
            String message,
            List<ChatMessageDto> history,
            Map<String, String> context
    ) {
    }

    public record ChatMessageDto(
            String role,
            String content
    ) {
    }

    public record ChatResponse(
            boolean success,
            String reply,
            String model,
            List<String> topics,
            String error
    ) {
    }

    private record OpenRouterResponse(List<Choice> choices) {
        private record Choice(Message message) {}
        private record Message(String content) {}
    }
}
