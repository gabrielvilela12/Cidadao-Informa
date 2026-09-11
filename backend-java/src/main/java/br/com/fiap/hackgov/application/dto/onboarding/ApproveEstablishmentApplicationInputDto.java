package br.com.fiap.hackgov.application.dto.onboarding;

import java.math.BigDecimal;

public record ApproveEstablishmentApplicationInputDto(
        BigDecimal monthlyAmount
) {
}
