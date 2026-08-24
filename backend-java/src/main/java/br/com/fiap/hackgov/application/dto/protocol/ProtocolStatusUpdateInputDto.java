package br.com.fiap.hackgov.application.dto.protocol;

import java.math.BigDecimal;

public record ProtocolStatusUpdateInputDto(String status, String reason, BigDecimal resolutionCost) {
}
