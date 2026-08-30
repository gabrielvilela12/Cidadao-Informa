package br.com.fiap.hackgov.application.dto.adminmaster;

import br.com.fiap.hackgov.application.dto.onboarding.EstablishmentApplicationOutputDto;
import br.com.fiap.hackgov.application.dto.onboarding.PlatformPlanOutputDto;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

public record PlatformOverviewOutputDto(
        long totalUsers,
        long citizens,
        long platformOwners,
        long establishmentOwners,
        long admins,
        long establishments,
        long activeEstablishments,
        long activeSubscriptions,
        long overdueSubscriptions,
        long pendingPayments,
        long pendingApplications,
        BigDecimal monthlyRecurringRevenue,
        BigDecimal pendingRevenue,
        List<PlatformPlanOutputDto> plans,
        List<EstablishmentApplicationOutputDto> establishmentApplications,
        List<EstablishmentSubscriptionOutputDto> establishmentSubscriptions
) {
    public record EstablishmentSubscriptionOutputDto(
            String establishmentId,
            String establishmentName,
            String establishmentType,
            String city,
            String state,
            String establishmentStatus,
            String primaryColor,
            String campaignName,
            String campaignScope,
            String campaignCity,
            String campaignState,
            String subscriptionId,
            String planName,
            String subscriptionStatus,
            BigDecimal monthlyAmount,
            Integer billingDay,
            Instant currentPeriodEnd,
            long owners,
            long admins,
            long citizens
    ) {
    }
}
