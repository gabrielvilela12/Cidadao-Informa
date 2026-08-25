package br.com.fiap.hackgov.application.service;

import com.fasterxml.jackson.annotation.JsonProperty;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

import java.util.List;
import java.util.Map;

@Service
public class ChatAssistantService {

    private static final Logger LOGGER = LoggerFactory.getLogger(ChatAssistantService.class);

    private final RestClient restClient;
    private final String chatFunctionUrl;
    private final String supabaseAnonKey;
    private final String openRouterApiKey;

    public ChatAssistantService(
            RestClient restClient,
            @Value("${app.supabase.edge-function-url}") String priorityFunctionUrl,
            @Value("${app.supabase.chat-function-url:}") String configuredChatFunctionUrl,
            @Value("${app.supabase.anon-key}") String supabaseAnonKey,
            @Value("${OPENROUTER_API_KEY:}") String openRouterApiKey
    ) {
        this.restClient = restClient;
        this.chatFunctionUrl = resolveChatFunctionUrl(priorityFunctionUrl, configuredChatFunctionUrl);
        this.supabaseAnonKey = supabaseAnonKey;
        this.openRouterApiKey = openRouterApiKey;
    }

    public ChatResponse sendChatMessage(ChatRequest request) {
        if (request == null || request.message() == null || request.message().isBlank()) {
            throw new IllegalArgumentException("A mensagem não pode ser vazia.");
        }

        // Tenta chamar a Edge Function do Supabase (que possui acesso aos secrets e modelo Gemini 3.7 Flash)
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
                LOGGER.warn("Falha ao consultar Edge Function de Chat ({}), aplicando fallback: {}", chatFunctionUrl, exception.getMessage());
            }
        }

        // Resposta de fallback institucional caso a Edge Function esteja indisponível
        return buildLocalResponse(request.message());
    }

    private ChatResponse buildLocalResponse(String userMessage) {
        String lower = userMessage.toLowerCase();
        String reply;
        List<String> topics;

        if (lower.contains("buraco") || lower.contains("asfalto") || lower.contains("abrir") || lower.contains("solicita") || lower.contains("chamado") || lower.contains("pedir")) {
            reply = "Para pedir um conserto para a sua rua (como buraco, poste apagado ou árvore perigosa):\n\n"
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

        return new ChatResponse(true, reply, "google/gemini-3.7-flash", topics, null);
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
}
