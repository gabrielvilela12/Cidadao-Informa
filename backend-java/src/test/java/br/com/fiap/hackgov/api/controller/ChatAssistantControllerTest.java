package br.com.fiap.hackgov.api.controller;

import br.com.fiap.hackgov.application.service.AiBillingService;
import br.com.fiap.hackgov.application.service.ChatAssistantService;
import br.com.fiap.hackgov.application.service.InsufficientAiCreditsException;
import br.com.fiap.hackgov.infrastructure.security.AuthenticatedUser;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

class ChatAssistantControllerTest {

    @Test
    void returnsPaymentRequiredWithoutCallingModelWhenWalletHasNoBalance() {
        ChatAssistantService chatService = mock(ChatAssistantService.class);
        AiBillingService billingService = mock(AiBillingService.class);
        ChatAssistantController controller = new ChatAssistantController(chatService, billingService);
        Authentication authentication = mock(Authentication.class);
        when(authentication.getPrincipal()).thenReturn(
                new AuthenticatedUser("user-1", "Dono", "123", "establishment_owner", "est-1")
        );
        when(billingService.reserveChatUsage("est-1", "user-1"))
                .thenThrow(new InsufficientAiCreditsException("Saldo insuficiente."));

        ResponseEntity<?> response = controller.chat(
                new ChatAssistantService.ChatRequest("Olá", null, null),
                authentication
        );

        assertEquals(HttpStatus.PAYMENT_REQUIRED, response.getStatusCode());
        verifyNoInteractions(chatService);
    }
}
