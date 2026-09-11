package br.com.fiap.hackgov.application.dto.onboarding;

import java.math.BigDecimal;

public record ApproveEstablishmentApplicationInputDto(
        String planCode,
        BigDecimal monthlyAmount
) {
}
