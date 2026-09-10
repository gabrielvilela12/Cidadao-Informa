package br.com.fiap.hackgov.api.controller;

import br.com.fiap.hackgov.api.response.ErrorResponse;
import br.com.fiap.hackgov.application.service.AiBillingService;
import br.com.fiap.hackgov.application.service.ChatAssistantService;
import br.com.fiap.hackgov.application.service.InsufficientAiCreditsException;
import br.com.fiap.hackgov.infrastructure.security.AuthenticatedUser;
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

    private final ChatAssistantService chatAssistantService;
    private final AiBillingService aiBillingService;

    public ChatAssistantController(ChatAssistantService chatAssistantService, AiBillingService aiBillingService) {
        this.chatAssistantService = chatAssistantService;
        this.aiBillingService = aiBillingService;
    }

    @PostMapping
    public ResponseEntity<?> chat(
            @RequestBody ChatAssistantService.ChatRequest request,
            Authentication authentication
    ) {
        AiBillingService.Reservation reservation = null;
        try {
            AuthenticatedUser user = requireTenantUser(authentication);
            reservation = aiBillingService.reserveChatUsage(user.establishmentId(), user.userId());
            ChatAssistantService.ChatResponse response = chatAssistantService.sendChatMessage(request);

            if (response.usage() == null) {
                aiBillingService.releaseReservation(reservation);
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
            return ResponseEntity.ok(response);
        } catch (InsufficientAiCreditsException exception) {
            return ResponseEntity.status(HttpStatus.PAYMENT_REQUIRED).body(new ErrorResponse(exception.getMessage()));
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

    private AuthenticatedUser requireTenantUser(Authentication authentication) {
        if (authentication == null
                || !(authentication.getPrincipal() instanceof AuthenticatedUser user)
                || user.establishmentId() == null
                || user.establishmentId().isBlank()) {
            throw new IllegalArgumentException(
                    "É necessário entrar em uma conta vinculada a um assinante para usar a IA."
            );
        }
        return user;
    }
}
