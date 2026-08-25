package br.com.fiap.hackgov.api.controller;

import br.com.fiap.hackgov.api.response.ErrorResponse;
import br.com.fiap.hackgov.application.service.ChatAssistantService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/ai/chat")
public class ChatAssistantController {

    private final ChatAssistantService chatAssistantService;

    public ChatAssistantController(ChatAssistantService chatAssistantService) {
        this.chatAssistantService = chatAssistantService;
    }

    @PostMapping
    public ResponseEntity<?> chat(@RequestBody ChatAssistantService.ChatRequest request) {
        try {
            ChatAssistantService.ChatResponse response = chatAssistantService.sendChatMessage(request);
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException exception) {
            return ResponseEntity.badRequest().body(new ErrorResponse(exception.getMessage()));
        } catch (Exception exception) {
            return ResponseEntity.internalServerError().body(new ErrorResponse("Erro ao consultar o assistente virtual."));
        }
    }
}
