package br.com.fiap.hackgov.api.controller;

import br.com.fiap.hackgov.api.response.ErrorResponse;
import br.com.fiap.hackgov.application.service.AiBillingService;
import br.com.fiap.hackgov.application.service.AiChatSettingsService;
import br.com.fiap.hackgov.application.service.AiUsageLimitExceededException;
import br.com.fiap.hackgov.application.service.ChatAssistantService;
import br.com.fiap.hackgov.application.service.ChatCacheService;
import br.com.fiap.hackgov.application.service.InsufficientAiCreditsException;
import br.com.fiap.hackgov.infrastructure.security.AuthenticatedUser;
import br.com.fiap.hackgov.infrastructure.security.RoleAccess;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/ai/chat")
public class ChatAssistantController {

    private static final Logger LOGGER = LoggerFactory.getLogger(ChatAssistantController.class);

    private final ChatAssistantService chatAssistantService;
    private final AiBillingService aiBillingService;
    private final ChatCacheService chatCacheService;
    private final AiChatSettingsService chatSettingsService;

    public ChatAssistantController(
            ChatAssistantService chatAssistantService,
            AiBillingService aiBillingService,
            ChatCacheService chatCacheService,
            AiChatSettingsService chatSettingsService
    ) {
        this.chatAssistantService = chatAssistantService;
        this.aiBillingService = aiBillingService;
        this.chatCacheService = chatCacheService;
        this.chatSettingsService = chatSettingsService;
    }

    @PostMapping
    public ResponseEntity<?> chat(
            @RequestBody ChatAssistantService.ChatRequest request,
            Authentication authentication
    ) {
        AiBillingService.Reservation reservation = null;
        try {
            AuthenticatedUser user = requireCitizenTenantUser(authentication);
            chatSettingsService.requireEnabled(user.establishmentId());

            var cachedResponse = chatCacheService.findCachedResponse(user.establishmentId(), request);
            if (cachedResponse.isPresent()) {
                return ResponseEntity.ok(cachedResponse.get());
            }

            reservation = aiBillingService.reserveChatUsage(user.establishmentId(), user.userId());
            ChatAssistantService.ChatResponse response = chatAssistantService.sendChatMessage(request);

            if (response.usage() == null) {
                aiBillingService.releaseReservation(reservation);
                cacheResponse(user, request, response);
                return ResponseEntity.ok(response);
            }

            AiBillingService.BillingReceipt receipt = aiBillingService.settleChatUsage(
                    reservation,
                    response.generationId(),
                    response.model(),
                    response.usage()
            );
            response = response.withBilling(new ChatAssistantService.BillingDetails(
                    receipt.chargedAmountBrl(),
                    receipt.balanceAfterBrl()
            ));
            cacheResponse(user, request, response);
            return ResponseEntity.ok(response);
        } catch (InsufficientAiCreditsException exception) {
            return ResponseEntity.status(HttpStatus.PAYMENT_REQUIRED).body(new ErrorResponse(exception.getMessage()));
        } catch (AiUsageLimitExceededException exception) {
            return ResponseEntity.status(HttpStatus.TOO_MANY_REQUESTS).body(new ErrorResponse(exception.getMessage()));
        } catch (IllegalArgumentException exception) {
            if (reservation != null) {
                aiBillingService.releaseReservation(reservation);
            }
            return ResponseEntity.badRequest().body(new ErrorResponse(exception.getMessage()));
        } catch (Exception exception) {
            if (reservation != null) {
                aiBillingService.releaseReservation(reservation);
            }
            return ResponseEntity.internalServerError().body(new ErrorResponse("Erro ao consultar o assistente virtual."));
        }
    }

    private void cacheResponse(
            AuthenticatedUser user,
            ChatAssistantService.ChatRequest request,
            ChatAssistantService.ChatResponse response
    ) {
        try {
            chatCacheService.storeResponse(user.establishmentId(), request, response);
        } catch (Exception exception) {
            LOGGER.warn("Falha ao salvar resposta do chatbot no cache: {}", exception.getMessage());
        }
    }

    private AuthenticatedUser requireCitizenTenantUser(Authentication authentication) {
        if (authentication == null
                || !(authentication.getPrincipal() instanceof AuthenticatedUser user)
                || user.establishmentId() == null
                || user.establishmentId().isBlank()) {
            throw new IllegalArgumentException(
                    "E necessario entrar em uma conta vinculada a uma prefeitura para usar a IA."
            );
        }
        if (!RoleAccess.CITIZEN.equals(RoleAccess.normalize(user.role()))) {
            throw new IllegalArgumentException("O chatbot e exclusivo para cidadaos logados.");
        }
        return user;
    }
}
