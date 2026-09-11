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
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.math.BigDecimal;

@Service
public class ChatAssistantService {

    private static final Logger LOGGER = LoggerFactory.getLogger(ChatAssistantService.class);
    private static final int MAX_MESSAGE_LENGTH = 2_000;
    private static final int MAX_HISTORY_MESSAGES = 6;
    private static final int MAX_HISTORY_ITEMS_ACCEPTED = 20;
    private static final int MAX_HISTORY_CONTENT_LENGTH = 2_000;
    private static final int MAX_CONTEXT_VALUE_LENGTH = 200;
    private static final String DEFAULT_PRIMARY_MODEL = "google/gemini-3.7-flash";
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
    private final String primaryModel;
    private final String economyModel;
    private final int responseCacheTtlSeconds;
    private final AiPromptService aiPromptService;

    public ChatAssistantService(
            RestClient restClient,
            @Value("${app.supabase.edge-function-url}") String priorityFunctionUrl,
            @Value("${app.supabase.chat-function-url:}") String configuredChatFunctionUrl,
            @Value("${app.supabase.anon-key}") String supabaseAnonKey,
            @Value("${OPENROUTER_API_KEY:}") String openRouterApiKey,
            @Value("${app.ai.chat.primary-model:google/gemini-3.7-flash}") String primaryModel,
            @Value("${app.ai.chat.economy-model:google/gemini-2.5-flash-lite}") String economyModel,
            @Value("${app.ai.chat.response-cache-ttl-seconds:300}") int responseCacheTtlSeconds,
            AiPromptService aiPromptService
    ) {
        this.restClient = restClient;
        this.chatFunctionUrl = resolveChatFunctionUrl(priorityFunctionUrl, configuredChatFunctionUrl);
        this.supabaseAnonKey = supabaseAnonKey;
        this.openRouterApiKey = openRouterApiKey;
        this.primaryModel = modelOrDefault(primaryModel, DEFAULT_PRIMARY_MODEL);
        this.economyModel = modelOrDefault(economyModel, this.primaryModel);
        this.responseCacheTtlSeconds = Math.max(60, Math.min(responseCacheTtlSeconds, 3600));
        this.aiPromptService = aiPromptService;
    }

    public ChatResponse sendChatMessage(ChatRequest request) {
        if (request == null || request.message() == null || request.message().isBlank()) {
            throw new IllegalArgumentException("A mensagem não pode ser vazia.");
        }
        validateRequestLimits(request);
        if (request.message().length() > 4_000) {
            throw new IllegalArgumentException("A mensagem deve ter no máximo 4.000 caracteres.");
        }
        if (request.history() != null) {
            if (request.history().size() > 12) {
                throw new IllegalArgumentException("O histórico deve ter no máximo 12 mensagens.");
            }
            int historyCharacters = request.history().stream()
                    .filter(message -> message != null && message.content() != null)
                    .mapToInt(message -> message.content().length())
                    .sum();
            if (historyCharacters > 16_000) {
                throw new IllegalArgumentException("O histórico da conversa excedeu o limite permitido.");
            }
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
                OpenRouterResponse completion = callOpenRouterDirect(request);
                String reply = completion == null || completion.choices() == null || completion.choices().isEmpty()
                        ? null
                        : completion.choices().get(0).message().content();
                if (reply != null && !reply.isBlank()) {
                    return new ChatResponse(
                            true,
                            reply,
                            completion.model() == null ? selectedModels(request.message()).get(0) : completion.model(),
                            List.of("Atendimento com IA"),
                            null,
                            completion.id(),
                            completion.usage() == null ? null : completion.usage().normalized(),
                            null
                    );
                }
            } catch (Exception exception) {
                LOGGER.warn("Falha ao consultar OpenRouter direto: {}", exception.getMessage());
            }
        }

        // 3. Fallback dinâmico contextualizado
        return buildLocalResponse(request.message());
    }

    private OpenRouterResponse callOpenRouterDirect(ChatRequest request) {
        String systemPrompt = aiPromptService.getPromptOrDefault("chatbot", DEFAULT_SYSTEM_PROMPT);
        List<String> models = selectedModels(request.message());
        boolean simpleRequest = isSimpleRequest(request.message());

        List<Map<String, String>> messages = new ArrayList<>();
        messages.add(Map.of("role", "system", "content", systemPrompt));

        if (request.history() != null) {
            int firstMessage = Math.max(0, request.history().size() - MAX_HISTORY_MESSAGES);
            for (ChatMessageDto msg : request.history().subList(firstMessage, request.history().size())) {
                if (msg != null && msg.content() != null && !msg.content().isBlank()) {
                    messages.add(Map.of(
                            "role", "assistant".equalsIgnoreCase(msg.role()) ? "assistant" : "user",
                            "content", msg.content()
                    ));
                }
            }
        }

        messages.add(Map.of("role", "user", "content", request.message()));

        Map<String, Object> body = new HashMap<>();
        body.put("models", models);
        body.put("temperature", 0.35);
        body.put("max_tokens", simpleRequest ? 450 : 800);
        body.put("messages", messages);

        RestClient.RequestBodySpec requestSpec = restClient.post()
                .uri(OPENROUTER_URL)
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + openRouterApiKey.trim())
                .header("HTTP-Referer", "https://cidadaoinforma.app")
                .header("X-Title", "Cidadao Informa - Assistente Virtual");
        if (isResponseCacheSafe(request)) {
            requestSpec.header("X-OpenRouter-Cache", "true");
            requestSpec.header("X-OpenRouter-Cache-TTL", String.valueOf(responseCacheTtlSeconds));
        }

        return requestSpec.contentType(MediaType.APPLICATION_JSON)
                .body(body)
                .retrieve()
                .body(OpenRouterResponse.class);
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

        return new ChatResponse(true, reply, primaryModel, topics, null, null, null, null);
    }

    private List<String> selectedModels(String message) {
        return (isSimpleRequest(message)
                ? List.of(economyModel, primaryModel)
                : List.of(primaryModel, economyModel))
                .stream()
                .distinct()
                .toList();
    }

    private boolean isSimpleRequest(String message) {
        String normalized = message == null ? "" : message.toLowerCase(Locale.ROOT);
        int words = normalized.isBlank() ? 0 : normalized.trim().split("\\s+").length;
        return normalized.length() <= 240
                && words <= 35
                && !normalized.matches(".*(compare|analise|análise|relatorio|relatório|detalhe|explique tudo|legislacao|legislação).*");
    }

    private boolean isResponseCacheSafe(ChatRequest request) {
        if (!isSimpleRequest(request.message()) || (request.history() != null && !request.history().isEmpty())) {
            return false;
        }
        String message = request.message();
        if (message.matches(".*(\\d|@).*")) return false;
        String normalized = message.toLowerCase(Locale.ROOT);
        if (normalized.matches(".*(cpf|cnpj|telefone|celular|email|e-mail).*")) return false;
        return normalized.matches(".*(como|onde|quais|ajuda|mapa|transparência|transparencia|acessibilidade|conserto|solicitação|solicitacao|pedido).*");
    }

    private static String modelOrDefault(String value, String fallback) {
        return value == null || value.isBlank() ? fallback : value.trim();
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
            String error,
            String generationId,
            Usage usage,
            BillingDetails billing
    ) {
        public ChatResponse withBilling(BillingDetails details) {
            return new ChatResponse(success, reply, model, topics, error, generationId, usage, details);
        }
    }

    private static void validateRequestLimits(ChatRequest request) {
        if (request.message().trim().length() > MAX_MESSAGE_LENGTH) {
            throw new IllegalArgumentException("A mensagem deve ter no máximo 2.000 caracteres.");
        }
        if (request.history() != null) {
            if (request.history().size() > MAX_HISTORY_ITEMS_ACCEPTED) {
                throw new IllegalArgumentException("O histórico deve ter no máximo 20 mensagens.");
            }
            for (ChatMessageDto message : request.history()) {
                if (message != null
                        && message.content() != null
                        && message.content().length() > MAX_HISTORY_CONTENT_LENGTH) {
                    throw new IllegalArgumentException("Cada mensagem do histórico deve ter no máximo 2.000 caracteres.");
                }
            }
        }
        if (request.context() != null && request.context().values().stream()
                .anyMatch(value -> value != null && value.length() > MAX_CONTEXT_VALUE_LENGTH)) {
            throw new IllegalArgumentException("O contexto da sessão é maior que o permitido.");
        }
    }

    public record Usage(
            Long promptTokens,
            Long completionTokens,
            Long totalTokens,
            Long reasoningTokens,
            Long cachedTokens,
            BigDecimal upstreamInferenceCost,
            BigDecimal cost
    ) {}

    public record BillingDetails(
            BigDecimal chargedAmountBrl,
            BigDecimal balanceAfterBrl
    ) {}

    private record OpenRouterResponse(
            String id,
            String model,
            List<Choice> choices,
            OpenRouterUsage usage
    ) {
        private record Choice(Message message) {}
        private record Message(String content) {}
    }

    private record OpenRouterUsage(
            @JsonProperty("prompt_tokens") Long promptTokens,
            @JsonProperty("completion_tokens") Long completionTokens,
            @JsonProperty("total_tokens") Long totalTokens,
            @JsonProperty("completion_tokens_details") CompletionTokenDetails completionTokenDetails,
            @JsonProperty("prompt_tokens_details") PromptTokenDetails promptTokenDetails,
            @JsonProperty("cost_details") CostDetails costDetails,
            BigDecimal cost
    ) {
        private Usage normalized() {
            return new Usage(
                    promptTokens,
                    completionTokens,
                    totalTokens,
                    completionTokenDetails == null ? 0L : completionTokenDetails.reasoningTokens(),
                    promptTokenDetails == null ? 0L : promptTokenDetails.cachedTokens(),
                    costDetails == null ? BigDecimal.ZERO : costDetails.upstreamInferenceCost(),
                    cost
            );
        }
    }

    private record CompletionTokenDetails(@JsonProperty("reasoning_tokens") Long reasoningTokens) {}
    private record PromptTokenDetails(@JsonProperty("cached_tokens") Long cachedTokens) {}
    private record CostDetails(
            @JsonProperty("upstream_inference_cost") BigDecimal upstreamInferenceCost
    ) {}
}
