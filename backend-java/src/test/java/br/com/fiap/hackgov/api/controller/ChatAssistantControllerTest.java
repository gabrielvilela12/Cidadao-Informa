package br.com.fiap.hackgov.api.controller;

import br.com.fiap.hackgov.application.service.AiBillingService;
import br.com.fiap.hackgov.application.service.AiChatSettingsService;
import br.com.fiap.hackgov.application.service.AiUsageLimitExceededException;
import br.com.fiap.hackgov.application.service.ChatAssistantService;
import br.com.fiap.hackgov.application.service.ChatCacheService;
import br.com.fiap.hackgov.application.service.InsufficientAiCreditsException;
import br.com.fiap.hackgov.infrastructure.security.AuthenticatedUser;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

class ChatAssistantControllerTest {

    @Test
    void returnsPaymentRequiredWithoutCallingModelWhenWalletHasNoBalance() {
        ChatAssistantService chatService = mock(ChatAssistantService.class);
        AiBillingService billingService = mock(AiBillingService.class);
        ChatCacheService cacheService = mock(ChatCacheService.class);
        AiChatSettingsService settingsService = mock(AiChatSettingsService.class);
        ChatAssistantController controller = controller(chatService, billingService, cacheService, settingsService);
        ChatAssistantService.ChatRequest request = request();
        when(cacheService.findCachedResponse("est-1", request)).thenReturn(Optional.empty());
        when(billingService.reserveChatUsage("est-1", "user-1"))
                .thenThrow(new InsufficientAiCreditsException("Saldo insuficiente."));

        ResponseEntity<?> response = controller.chat(request, authentication("citizen"));

        assertEquals(HttpStatus.PAYMENT_REQUIRED, response.getStatusCode());
        verifyNoInteractions(chatService);
    }

    @Test
    void returnsCachedResponseWithoutReservingCreditsOrCallingModel() {
        ChatAssistantService chatService = mock(ChatAssistantService.class);
        AiBillingService billingService = mock(AiBillingService.class);
        ChatCacheService cacheService = mock(ChatCacheService.class);
        AiChatSettingsService settingsService = mock(AiChatSettingsService.class);
        ChatAssistantController controller = controller(chatService, billingService, cacheService, settingsService);
        ChatAssistantService.ChatRequest request = request();
        ChatAssistantService.ChatResponse cached = new ChatAssistantService.ChatResponse(
                true,
                "Abra a tela Nova solicitacao.",
                "cache:model",
                List.of("Nova solicitacao"),
                null,
                "cache:1",
                null,
                null
        );
        when(cacheService.findCachedResponse("est-1", request)).thenReturn(Optional.of(cached));

        ResponseEntity<?> response = controller.chat(request, authentication("citizen"));

        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertEquals(cached, response.getBody());
        verifyNoInteractions(chatService, billingService);
    }

    @Test
    void blocksChatWhenEstablishmentDisabledIt() {
        ChatAssistantService chatService = mock(ChatAssistantService.class);
        AiBillingService billingService = mock(AiBillingService.class);
        ChatCacheService cacheService = mock(ChatCacheService.class);
        AiChatSettingsService settingsService = mock(AiChatSettingsService.class);
        ChatAssistantController controller = controller(chatService, billingService, cacheService, settingsService);
        doThrow(new IllegalArgumentException("O chatbot esta desativado para esta prefeitura."))
                .when(settingsService).requireEnabled("est-1");

        ResponseEntity<?> response = controller.chat(request(), authentication("citizen"));

        assertEquals(HttpStatus.BAD_REQUEST, response.getStatusCode());
        verifyNoInteractions(chatService, billingService, cacheService);
    }

    @Test
    void returnsTooManyRequestsWhenCitizenReachedUsageLimit() {
        ChatAssistantService chatService = mock(ChatAssistantService.class);
        AiBillingService billingService = mock(AiBillingService.class);
        ChatCacheService cacheService = mock(ChatCacheService.class);
        AiChatSettingsService settingsService = mock(AiChatSettingsService.class);
        ChatAssistantController controller = controller(chatService, billingService, cacheService, settingsService);
        ChatAssistantService.ChatRequest request = request();
        when(cacheService.findCachedResponse("est-1", request)).thenReturn(Optional.empty());
        when(billingService.reserveChatUsage("est-1", "user-1"))
                .thenThrow(new AiUsageLimitExceededException("Limite diário atingido."));

        ResponseEntity<?> response = controller.chat(request, authentication("citizen"));

        assertEquals(HttpStatus.TOO_MANY_REQUESTS, response.getStatusCode());
        verifyNoInteractions(chatService);
    }

    @Test
    void blocksNonCitizenAccounts() {
        ChatAssistantService chatService = mock(ChatAssistantService.class);
        AiBillingService billingService = mock(AiBillingService.class);
        ChatCacheService cacheService = mock(ChatCacheService.class);
        AiChatSettingsService settingsService = mock(AiChatSettingsService.class);
        ChatAssistantController controller = controller(chatService, billingService, cacheService, settingsService);

        ResponseEntity<?> response = controller.chat(request(), authentication("admin"));

        assertEquals(HttpStatus.BAD_REQUEST, response.getStatusCode());
        verifyNoInteractions(chatService, billingService, cacheService, settingsService);
    }

    private ChatAssistantController controller(
            ChatAssistantService chatService,
            AiBillingService billingService,
            ChatCacheService cacheService,
            AiChatSettingsService settingsService
    ) {
        return new ChatAssistantController(chatService, billingService, cacheService, settingsService);
    }

    private ChatAssistantService.ChatRequest request() {
        return new ChatAssistantService.ChatRequest("Como abrir uma solicitacao?", null, null);
    }

    private Authentication authentication(String role) {
        Authentication authentication = mock(Authentication.class);
        when(authentication.getPrincipal()).thenReturn(
                new AuthenticatedUser("user-1", "Usuario", "123", role, "est-1")
        );
        return authentication;
    }
}
