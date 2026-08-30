package br.com.fiap.hackgov.application.dto.adminmaster;

import java.math.BigDecimal;

public record CreateSubscriptionInputDto(
        String establishmentName,
        String document,
        String city,
        String state,
        String primaryColor,
        String logoUrl,
        String planName,
        String subscriptionStatus,
        BigDecimal monthlyAmount,
        Integer billingDay,
        String ownerName,
        String ownerEmail,
        String ownerCpf,
        String ownerPhone,
        String ownerPassword
) {
}
