package br.com.fiap.hackgov.application.dto.adminmaster;

import br.com.fiap.hackgov.application.dto.adminmaster.PlatformOverviewOutputDto.EstablishmentSubscriptionOutputDto;
import br.com.fiap.hackgov.application.dto.protocol.ProtocolSummaryOutputDto;
import br.com.fiap.hackgov.domain.billing.SubscriptionPayment;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;

public record EstablishmentDetailsOutputDto(
        EstablishmentSubscriptionOutputDto establishment,
        List<ProtocolSummaryOutputDto> protocols,
        List<PaymentOutputDto> payments
) {
    public record PaymentOutputDto(
            String id,
            String subscriptionId,
            BigDecimal amount,
            String status,
            LocalDate dueDate,
            Instant paidAt,
            String paymentMethod,
            String externalReference,
            Instant createdAt
    ) {
        public static PaymentOutputDto from(SubscriptionPayment payment) {
            return new PaymentOutputDto(
                    payment.getId(),
                    payment.getSubscriptionId(),
                    payment.getAmount(),
                    payment.getStatus(),
                    payment.getDueDate(),
                    payment.getPaidAt(),
                    payment.getPaymentMethod(),
                    payment.getExternalReference(),
                    payment.getCreatedAt()
            );
        }
    }
}
