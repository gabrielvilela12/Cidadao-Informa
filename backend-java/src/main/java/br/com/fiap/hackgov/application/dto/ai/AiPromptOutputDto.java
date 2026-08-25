package br.com.fiap.hackgov.application.dto.ai;

import br.com.fiap.hackgov.domain.ai.AiPrompt;

import java.time.Instant;
import java.util.UUID;

public record AiPromptOutputDto(
        UUID id,
        String agentKey,
        String name,
        String description,
        String promptText,
        int version,
        String updatedBy,
        Instant createdAt,
        Instant updatedAt
) {
    public static AiPromptOutputDto from(AiPrompt prompt) {
        return new AiPromptOutputDto(
                prompt.getId(),
                prompt.getAgentKey(),
                prompt.getName(),
                prompt.getDescription(),
                prompt.getPromptText(),
                prompt.getVersion(),
                prompt.getUpdatedBy(),
                prompt.getCreatedAt(),
                prompt.getUpdatedAt()
        );
    }
}
