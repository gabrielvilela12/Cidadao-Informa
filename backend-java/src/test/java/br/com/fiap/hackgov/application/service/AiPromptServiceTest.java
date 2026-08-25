package br.com.fiap.hackgov.application.service;

import br.com.fiap.hackgov.application.dto.ai.AiPromptOutputDto;
import br.com.fiap.hackgov.domain.ai.AiPrompt;
import br.com.fiap.hackgov.infrastructure.repository.AiPromptRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.Instant;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AiPromptServiceTest {
    @Mock
    private AiPromptRepository repository;

    @InjectMocks
    private AiPromptService service;

    @Test
    void updatesPromptAndIncrementsVersion() {
        AiPrompt prompt = prompt("chatbot", "Prompt anterior com conteúdo suficiente.");
        when(repository.findByAgentKey("chatbot")).thenReturn(Optional.of(prompt));
        when(repository.save(prompt)).thenReturn(prompt);

        AiPromptOutputDto result = service.update(
                "chatbot",
                "Novo prompt do chatbot com orientação clara para o cidadão.",
                "admin-id"
        );

        assertEquals(2, result.version());
        assertEquals("admin-id", result.updatedBy());
        assertEquals("Novo prompt do chatbot com orientação clara para o cidadão.", result.promptText());
    }

    @Test
    void requiresRuntimeVariablesForPriorityAgent() {
        IllegalArgumentException exception = assertThrows(
                IllegalArgumentException.class,
                () -> service.update("priority", "Classifique esta solicitação sem variáveis.", "admin-id")
        );

        assertEquals(
                "Mantenha as variáveis obrigatórias no prompt: {{category}}, {{description}}",
                exception.getMessage()
        );
    }

    @Test
    void returnsFallbackWhenManagedPromptDoesNotExist() {
        when(repository.findByAgentKey("chatbot")).thenReturn(Optional.empty());
        assertEquals("fallback", service.getPromptOrDefault("chatbot", "fallback"));
    }

    private AiPrompt prompt(String agentKey, String text) {
        AiPrompt prompt = new AiPrompt();
        prompt.setId(UUID.randomUUID());
        prompt.setAgentKey(agentKey);
        prompt.setName("Agente");
        prompt.setDescription("Descrição");
        prompt.setPromptText(text);
        prompt.setVersion(1);
        prompt.setCreatedAt(Instant.parse("2026-08-25T10:00:00Z"));
        prompt.setUpdatedAt(Instant.parse("2026-08-25T10:00:00Z"));
        return prompt;
    }
}
