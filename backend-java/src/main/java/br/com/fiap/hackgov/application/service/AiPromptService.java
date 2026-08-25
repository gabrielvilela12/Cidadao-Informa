package br.com.fiap.hackgov.application.service;

import br.com.fiap.hackgov.application.dto.ai.AiPromptOutputDto;
import br.com.fiap.hackgov.domain.ai.AiPrompt;
import br.com.fiap.hackgov.infrastructure.repository.AiPromptRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.Set;

@Service
public class AiPromptService {
    private static final Set<String> AGENTS = Set.of("chatbot", "priority", "image");
    private static final int MAX_PROMPT_LENGTH = 20_000;

    private final AiPromptRepository repository;

    public AiPromptService(AiPromptRepository repository) {
        this.repository = repository;
    }

    @Transactional(readOnly = true)
    public List<AiPromptOutputDto> list() {
        return repository.findAllByOrderByAgentKeyAsc().stream()
                .map(AiPromptOutputDto::from)
                .toList();
    }

    @Transactional
    public AiPromptOutputDto update(String agentKey, String promptText, String adminId) {
        validateAgent(agentKey);
        String normalizedPrompt = validatePrompt(agentKey, promptText);
        AiPrompt prompt = repository.findByAgentKey(agentKey)
                .orElseThrow(() -> new IllegalArgumentException("Prompt de IA não encontrado."));

        prompt.setPromptText(normalizedPrompt);
        prompt.setVersion(prompt.getVersion() + 1);
        prompt.setUpdatedBy(adminId);
        prompt.setUpdatedAt(Instant.now());
        return AiPromptOutputDto.from(repository.save(prompt));
    }

    @Transactional(readOnly = true)
    public String getPromptOrDefault(String agentKey, String fallback) {
        if (!AGENTS.contains(agentKey)) return fallback;
        return repository.findByAgentKey(agentKey)
                .map(AiPrompt::getPromptText)
                .filter(text -> text != null && !text.isBlank())
                .orElse(fallback);
    }

    private void validateAgent(String agentKey) {
        if (!AGENTS.contains(agentKey)) {
            throw new IllegalArgumentException("Agente de IA inválido.");
        }
    }

    private String validatePrompt(String agentKey, String promptText) {
        if (promptText == null || promptText.trim().length() < 20) {
            throw new IllegalArgumentException("O prompt deve ter pelo menos 20 caracteres.");
        }
        String normalized = promptText.trim();
        if (normalized.length() > MAX_PROMPT_LENGTH) {
            throw new IllegalArgumentException("O prompt deve ter no máximo 20.000 caracteres.");
        }
        List<String> requiredVariables = switch (agentKey) {
            case "priority" -> List.of("{{category}}", "{{description}}");
            case "image" -> List.of("{{category}}", "{{description}}", "{{correction_report}}");
            default -> List.of();
        };
        List<String> missingVariables = requiredVariables.stream()
                .filter(variable -> !normalized.contains(variable))
                .toList();
        if (!missingVariables.isEmpty()) {
            throw new IllegalArgumentException(
                    "Mantenha as variáveis obrigatórias no prompt: " + String.join(", ", missingVariables)
            );
        }
        return normalized;
    }
}
