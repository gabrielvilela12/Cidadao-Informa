package br.com.fiap.hackgov.application.dto.onboarding;

import java.time.Instant;

public record EstablishmentApplicationOutputDto(
        String id,
        String establishmentName,
        String document,
        String city,
        String state,
        String primaryColor,
        String logoUrl,
        String campaignName,
        String campaignScope,
        String planCode,
        String planName,
        String requesterName,
        String requesterEmail,
        String requesterCpf,
        String requesterPhone,
        String status,
        String rejectionReason,
        String createdEstablishmentId,
        String createdSubscriptionId,
        String createdCampaignId,
        Instant reviewedAt,
        Instant createdAt
) {
}
