package br.com.fiap.hackgov.application.dto.onboarding;

public record CreateEstablishmentApplicationInputDto(
        String establishmentName,
        String document,
        String city,
        String state,
        String primaryColor,
        String logoUrl,
        String campaignName,
        String campaignScope,
        String planCode,
        String requesterName,
        String requesterEmail,
        String requesterCpf,
        String requesterPhone,
        String requesterPassword
) {
}
