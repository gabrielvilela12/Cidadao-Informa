package br.com.fiap.hackgov.application.dto.ai;

public record AiChatSettingsOutputDto(
        String establishmentId,
        String establishmentName,
        boolean chatEnabled
) {
}
