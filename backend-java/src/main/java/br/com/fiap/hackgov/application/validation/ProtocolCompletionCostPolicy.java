package br.com.fiap.hackgov.application.validation;

import java.math.BigDecimal;

public final class ProtocolCompletionCostPolicy {

    private static final String COMPLETED_STATUS = "Concluído";
    private static final BigDecimal MAX_COST = new BigDecimal("9999999999.99");

    private ProtocolCompletionCostPolicy() {
    }

    public static BigDecimal validate(String status, BigDecimal cost) {
        if (!COMPLETED_STATUS.equals(status)) {
            return null;
        }
        if (cost == null) {
            throw new IllegalArgumentException("Informe o custo da correção para concluir o protocolo.");
        }
        if (cost.signum() < 0) {
            throw new IllegalArgumentException("O custo da correção não pode ser negativo.");
        }
        if (cost.stripTrailingZeros().scale() > 2) {
            throw new IllegalArgumentException("Informe o custo com no máximo duas casas decimais.");
        }
        if (cost.compareTo(MAX_COST) > 0) {
            throw new IllegalArgumentException("O custo informado ultrapassa o limite permitido.");
        }
        return cost.setScale(2);
    }
}
