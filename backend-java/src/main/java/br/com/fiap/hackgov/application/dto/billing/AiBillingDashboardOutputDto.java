package br.com.fiap.hackgov.application.dto.billing;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;

public record AiBillingDashboardOutputDto(
        WalletOutputDto wallet,
        SubscriptionOutputDto subscription,
        UsageSummaryOutputDto currentMonth,
        BalanceHealthOutputDto balanceHealth,
        UsageLimitsOutputDto usageLimits,
        List<UsageOutputDto> usage,
        List<TransactionOutputDto> transactions,
        List<TopUpOutputDto> topUps
) {
    public record WalletOutputDto(
            BigDecimal balanceBrl,
            BigDecimal totalCreditedBrl,
            BigDecimal totalConsumedBrl,
            Instant updatedAt
    ) {}

    public record SubscriptionOutputDto(
            String id,
            String planName,
            String status,
            BigDecimal monthlyAmountBrl,
            Integer billingDay,
            Instant currentPeriodEnd
    ) {}

    public record UsageSummaryOutputDto(
            long requests,
            long promptTokens,
            long completionTokens,
            long totalTokens,
            long cachedTokens,
            BigDecimal openRouterCostUsd,
            BigDecimal upstreamInferenceCostUsd,
            BigDecimal chargedAmountBrl
    ) {}

    public record BalanceHealthOutputDto(
            String level,
            BigDecimal referenceBalanceBrl,
            BigDecimal remainingPercent,
            BigDecimal averageDailySpendBrl,
            Integer estimatedDaysRemaining,
            String message
    ) {}

    public record UsageLimitsOutputDto(
            int requestsPerMinute,
            int requestsPerHour,
            int requestsPerDay,
            long tokensPerDay,
            int concurrentRequests
    ) {}

    public record UsageOutputDto(
            String id,
            String generationId,
            String feature,
            String model,
            long promptTokens,
            long completionTokens,
            long totalTokens,
            long reasoningTokens,
            long cachedTokens,
            BigDecimal openRouterCostUsd,
            BigDecimal upstreamInferenceCostUsd,
            BigDecimal usdToBrlRate,
            BigDecimal markupPercent,
            BigDecimal chargedAmountBrl,
            Instant createdAt
    ) {}

    public record TransactionOutputDto(
            String id,
            String type,
            String status,
            BigDecimal amountBrl,
            BigDecimal balanceAfterBrl,
            String description,
            Instant createdAt,
            Instant settledAt
    ) {}

    public record TopUpOutputDto(
            String id,
            BigDecimal amountBrl,
            String status,
            LocalDate dueDate,
            Instant paidAt,
            String paymentMethod,
            Instant createdAt
    ) {}
}
