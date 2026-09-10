package br.com.fiap.hackgov.application.service;

import br.com.fiap.hackgov.domain.billing.AiCreditTransaction;
import br.com.fiap.hackgov.domain.billing.AiCreditWallet;
import br.com.fiap.hackgov.domain.billing.AiUsageRecord;
import br.com.fiap.hackgov.domain.billing.Subscription;
import br.com.fiap.hackgov.infrastructure.persistence.repository.JpaAiCreditTransactionRepository;
import br.com.fiap.hackgov.infrastructure.persistence.repository.JpaAiCreditWalletRepository;
import br.com.fiap.hackgov.infrastructure.persistence.repository.JpaAiUsageRecordRepository;
import br.com.fiap.hackgov.infrastructure.persistence.repository.JpaSubscriptionPaymentRepository;
import br.com.fiap.hackgov.infrastructure.persistence.repository.JpaSubscriptionRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;

import java.math.BigDecimal;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class AiBillingServiceTest {

    private JpaAiCreditWalletRepository walletRepository;
    private JpaAiCreditTransactionRepository transactionRepository;
    private JpaAiUsageRecordRepository usageRepository;
    private JpaSubscriptionRepository subscriptionRepository;
    private AiBillingService service;

    @BeforeEach
    void setUp() {
        walletRepository = mock(JpaAiCreditWalletRepository.class);
        transactionRepository = mock(JpaAiCreditTransactionRepository.class);
        usageRepository = mock(JpaAiUsageRecordRepository.class);
        subscriptionRepository = mock(JpaSubscriptionRepository.class);
        service = new AiBillingService(
                walletRepository,
                transactionRepository,
                usageRepository,
                subscriptionRepository,
                mock(JpaSubscriptionPaymentRepository.class),
                new BigDecimal("0.10"),
                new BigDecimal("5.50"),
                new BigDecimal("20.00"),
                new BigDecimal("10.00")
        );
    }

    @Test
    void blocksChatBeforeCallingProviderWhenBalanceCannotCoverReservation() {
        when(subscriptionRepository.findFirstByEstablishmentIdOrderByCreatedAtDesc("est-1"))
                .thenReturn(Optional.of(activeSubscription()));
        AiCreditWallet wallet = wallet("0.05");
        when(walletRepository.findByEstablishmentIdForUpdate("est-1")).thenReturn(Optional.of(wallet));

        assertThrows(
                InsufficientAiCreditsException.class,
                () -> service.reserveChatUsage("est-1", "user-1")
        );

        assertMoney("0.05", wallet.getBalanceBrl());
        verify(transactionRepository, never()).save(any());
    }

    @Test
    void settlesReservationUsingProviderCostExchangeRateAndMarkup() {
        AiCreditWallet wallet = wallet("9.90");
        AiCreditTransaction transaction = new AiCreditTransaction();
        transaction.setId("tx-1");
        transaction.setEstablishmentId("est-1");
        transaction.setType("usage");
        transaction.setStatus("pending");
        transaction.setAmountBrl(new BigDecimal("-0.10"));
        transaction.setReservedAmountBrl(new BigDecimal("0.10"));
        transaction.setBalanceAfterBrl(new BigDecimal("9.90"));

        when(transactionRepository.findById("tx-1")).thenReturn(Optional.of(transaction));
        when(walletRepository.findByEstablishmentIdForUpdate("est-1")).thenReturn(Optional.of(wallet));

        AiBillingService.BillingReceipt receipt = service.settleChatUsage(
                new AiBillingService.Reservation("tx-1", "est-1", "user-1"),
                "gen-123",
                "google/gemini-3.7-flash",
                new ChatAssistantService.Usage(
                        1000L,
                        200L,
                        1200L,
                        20L,
                        100L,
                        new BigDecimal("0.0008"),
                        new BigDecimal("0.001")
                )
        );

        assertMoney("0.006600", receipt.chargedAmountBrl());
        assertMoney("9.993400", receipt.balanceAfterBrl());
        assertMoney("0.006600", wallet.getTotalConsumedBrl());
        assertEquals("completed", transaction.getStatus());

        ArgumentCaptor<AiUsageRecord> usageCaptor = ArgumentCaptor.forClass(AiUsageRecord.class);
        verify(usageRepository).save(usageCaptor.capture());
        AiUsageRecord recorded = usageCaptor.getValue();
        assertEquals("gen-123", recorded.getGenerationId());
        assertEquals(1200L, recorded.getTotalTokens());
        assertMoney("0.001", recorded.getOpenRouterCostUsd());
        assertMoney("0.0008", recorded.getUpstreamInferenceCostUsd());
        assertMoney("0.006600", recorded.getChargedAmountBrl());
    }

    private Subscription activeSubscription() {
        Subscription subscription = new Subscription();
        subscription.setId("sub-1");
        subscription.setEstablishmentId("est-1");
        subscription.setStatus("active");
        return subscription;
    }

    private AiCreditWallet wallet(String balance) {
        AiCreditWallet wallet = new AiCreditWallet();
        wallet.setEstablishmentId("est-1");
        wallet.setBalanceBrl(new BigDecimal(balance));
        wallet.setTotalCreditedBrl(new BigDecimal("10.00"));
        wallet.setTotalConsumedBrl(BigDecimal.ZERO);
        return wallet;
    }

    private void assertMoney(String expected, BigDecimal actual) {
        assertEquals(0, new BigDecimal(expected).compareTo(actual));
    }
}
