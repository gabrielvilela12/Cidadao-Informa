package br.com.fiap.hackgov.application.validation;

import org.junit.jupiter.api.Test;

import java.math.BigDecimal;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;

class ProtocolCompletionCostPolicyTest {

    @Test
    void requiresCostWhenProtocolIsCompleted() {
        IllegalArgumentException exception = assertThrows(
                IllegalArgumentException.class,
                () -> ProtocolCompletionCostPolicy.validate("Concluído", null)
        );

        assertEquals("Informe o custo da correção para concluir o protocolo.", exception.getMessage());
    }

    @Test
    void acceptsZeroAndNormalizesToTwoDecimalPlaces() {
        assertEquals(
                new BigDecimal("0.00"),
                ProtocolCompletionCostPolicy.validate("Concluído", BigDecimal.ZERO)
        );
    }

    @Test
    void rejectsNegativeCost() {
        assertThrows(
                IllegalArgumentException.class,
                () -> ProtocolCompletionCostPolicy.validate("Concluído", new BigDecimal("-0.01"))
        );
    }

    @Test
    void rejectsMoreThanTwoSignificantDecimalPlaces() {
        assertThrows(
                IllegalArgumentException.class,
                () -> ProtocolCompletionCostPolicy.validate("Concluído", new BigDecimal("10.001"))
        );
    }

    @Test
    void ignoresCostForStatusesThatAreNotCompleted() {
        assertNull(ProtocolCompletionCostPolicy.validate("Em Análise", new BigDecimal("150.00")));
    }
}
