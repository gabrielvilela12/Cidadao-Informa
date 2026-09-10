package br.com.fiap.hackgov.application.service;

import br.com.fiap.hackgov.application.dto.billing.AiBillingDashboardOutputDto;
import br.com.fiap.hackgov.application.dto.billing.AiBillingDashboardOutputDto.SubscriptionOutputDto;
import br.com.fiap.hackgov.application.dto.billing.AiBillingDashboardOutputDto.TopUpOutputDto;
import br.com.fiap.hackgov.application.dto.billing.AiBillingDashboardOutputDto.TransactionOutputDto;
import br.com.fiap.hackgov.application.dto.billing.AiBillingDashboardOutputDto.UsageOutputDto;
import br.com.fiap.hackgov.application.dto.billing.AiBillingDashboardOutputDto.UsageSummaryOutputDto;
import br.com.fiap.hackgov.application.dto.billing.AiBillingDashboardOutputDto.WalletOutputDto;
import br.com.fiap.hackgov.domain.billing.AiCreditTransaction;
import br.com.fiap.hackgov.domain.billing.AiCreditWallet;
import br.com.fiap.hackgov.domain.billing.AiUsageRecord;
import br.com.fiap.hackgov.domain.billing.Subscription;
import br.com.fiap.hackgov.domain.billing.SubscriptionPayment;
import br.com.fiap.hackgov.infrastructure.persistence.repository.JpaAiCreditTransactionRepository;
import br.com.fiap.hackgov.infrastructure.persistence.repository.JpaAiCreditWalletRepository;
import br.com.fiap.hackgov.infrastructure.persistence.repository.JpaAiUsageRecordRepository;
import br.com.fiap.hackgov.infrastructure.persistence.repository.JpaSubscriptionPaymentRepository;
import br.com.fiap.hackgov.infrastructure.persistence.repository.JpaSubscriptionRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.time.temporal.TemporalAdjusters;
import java.util.List;
import java.util.UUID;

@Service
public class AiBillingService {

    public static final String TOP_UP_PURPOSE = "ai_credit_topup";
    private static final BigDecimal HUNDRED = new BigDecimal("100");
    private static final int MONEY_SCALE = 6;

    private final JpaAiCreditWalletRepository walletRepository;
    private final JpaAiCreditTransactionRepository transactionRepository;
    private final JpaAiUsageRecordRepository usageRepository;
    private final JpaSubscriptionRepository subscriptionRepository;
    private final JpaSubscriptionPaymentRepository paymentRepository;
    private final BigDecimal reservationBrl;
    private final BigDecimal usdToBrlRate;
    private final BigDecimal markupPercent;
    private final BigDecimal minimumTopUpBrl;

    public AiBillingService(
            JpaAiCreditWalletRepository walletRepository,
            JpaAiCreditTransactionRepository transactionRepository,
            JpaAiUsageRecordRepository usageRepository,
            JpaSubscriptionRepository subscriptionRepository,
            JpaSubscriptionPaymentRepository paymentRepository,
            @Value("${app.ai.billing.chat-reservation-brl:0.10}") BigDecimal reservationBrl,
            @Value("${app.ai.billing.usd-to-brl-rate:5.50}") BigDecimal usdToBrlRate,
            @Value("${app.ai.billing.markup-percent:20.00}") BigDecimal markupPercent,
            @Value("${app.ai.billing.minimum-top-up-brl:10.00}") BigDecimal minimumTopUpBrl
    ) {
        this.walletRepository = walletRepository;
        this.transactionRepository = transactionRepository;
        this.usageRepository = usageRepository;
        this.subscriptionRepository = subscriptionRepository;
        this.paymentRepository = paymentRepository;
        this.reservationBrl = positive(reservationBrl, "Reserva por chamada inválida.");
        this.usdToBrlRate = positive(usdToBrlRate, "Cotação USD/BRL inválida.");
        this.markupPercent = nonNegative(markupPercent, "Margem de IA inválida.");
        this.minimumTopUpBrl = positive(minimumTopUpBrl, "Recarga mínima inválida.");
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public Reservation reserveChatUsage(String establishmentId, String userId) {
        requireActiveSubscription(establishmentId);
        AiCreditWallet wallet = lockedWallet(establishmentId);
        if (wallet.getBalanceBrl().compareTo(reservationBrl) < 0) {
            throw new InsufficientAiCreditsException(
                    "Saldo de IA insuficiente. Solicite uma recarga para continuar usando o chatbot."
            );
        }

        wallet.setBalanceBrl(wallet.getBalanceBrl().subtract(reservationBrl));
        walletRepository.save(wallet);

        AiCreditTransaction transaction = new AiCreditTransaction();
        transaction.setEstablishmentId(establishmentId);
        transaction.setType("usage");
        transaction.setStatus("pending");
        transaction.setAmountBrl(reservationBrl.negate());
        transaction.setReservedAmountBrl(reservationBrl);
        transaction.setBalanceAfterBrl(wallet.getBalanceBrl());
        transaction.setReferenceId("chat:" + UUID.randomUUID());
        transaction.setDescription("Reserva para chamada do chatbot");
        transaction.setCreatedBy(userId);
        transactionRepository.save(transaction);
        return new Reservation(transaction.getId(), establishmentId, userId);
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public BillingReceipt settleChatUsage(
            Reservation reservation,
            String generationId,
            String model,
            ChatAssistantService.Usage usage
    ) {
        AiCreditTransaction transaction = pendingReservation(reservation.transactionId());
        AiCreditWallet wallet = lockedWallet(reservation.establishmentId());
        BigDecimal openRouterCostUsd = nonNegative(
                usage.cost() == null ? BigDecimal.ZERO : usage.cost(),
                "Custo da OpenRouter inválido."
        );
        BigDecimal upstreamInferenceCostUsd = nonNegative(
                usage.upstreamInferenceCost() == null ? BigDecimal.ZERO : usage.upstreamInferenceCost(),
                "Custo do provedor inválido."
        );
        BigDecimal calculatedCharge = openRouterCostUsd
                .multiply(usdToBrlRate)
                .multiply(BigDecimal.ONE.add(markupPercent.divide(HUNDRED, 8, RoundingMode.HALF_UP)))
                .setScale(MONEY_SCALE, RoundingMode.HALF_UP);

        BigDecimal availableForSettlement = wallet.getBalanceBrl().add(transaction.getReservedAmountBrl());
        BigDecimal chargedAmount = calculatedCharge.min(availableForSettlement);
        BigDecimal adjustment = transaction.getReservedAmountBrl().subtract(chargedAmount);
        wallet.setBalanceBrl(wallet.getBalanceBrl().add(adjustment));
        wallet.setTotalConsumedBrl(wallet.getTotalConsumedBrl().add(chargedAmount));
        walletRepository.save(wallet);

        transaction.setStatus("completed");
        transaction.setAmountBrl(chargedAmount.negate());
        transaction.setBalanceAfterBrl(wallet.getBalanceBrl());
        transaction.setDescription("Consumo do chatbot");
        transaction.setSettledAt(Instant.now());
        transactionRepository.save(transaction);

        AiUsageRecord record = new AiUsageRecord();
        record.setEstablishmentId(reservation.establishmentId());
        record.setUserId(reservation.userId());
        record.setTransactionId(transaction.getId());
        record.setGenerationId(blankToNull(generationId));
        record.setFeature("chatbot");
        record.setModel(model == null || model.isBlank() ? "unknown" : model);
        record.setPromptTokens(safeTokenCount(usage.promptTokens()));
        record.setCompletionTokens(safeTokenCount(usage.completionTokens()));
        record.setTotalTokens(safeTokenCount(usage.totalTokens()));
        record.setReasoningTokens(safeTokenCount(usage.reasoningTokens()));
        record.setCachedTokens(safeTokenCount(usage.cachedTokens()));
        record.setOpenRouterCostUsd(openRouterCostUsd);
        record.setUpstreamInferenceCostUsd(upstreamInferenceCostUsd);
        record.setUsdToBrlRate(usdToBrlRate);
        record.setMarkupPercent(markupPercent);
        record.setChargedAmountBrl(chargedAmount);
        usageRepository.save(record);

        return new BillingReceipt(chargedAmount, wallet.getBalanceBrl());
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void releaseReservation(Reservation reservation) {
        transactionRepository.findById(reservation.transactionId())
                .filter(transaction -> "pending".equals(transaction.getStatus()))
                .ifPresent(transaction -> {
                    AiCreditWallet wallet = lockedWallet(reservation.establishmentId());
                    wallet.setBalanceBrl(wallet.getBalanceBrl().add(transaction.getReservedAmountBrl()));
                    walletRepository.save(wallet);
                    transaction.setStatus("reversed");
                    transaction.setAmountBrl(BigDecimal.ZERO);
                    transaction.setBalanceAfterBrl(wallet.getBalanceBrl());
                    transaction.setDescription("Reserva liberada: chamada sem cobrança");
                    transaction.setSettledAt(Instant.now());
                    transactionRepository.save(transaction);
                });
    }

    @Transactional
    public AiBillingDashboardOutputDto requestTopUp(String establishmentId, BigDecimal amountBrl) {
        BigDecimal normalizedAmount = requireTopUpAmount(amountBrl);
        Subscription subscription = requireActiveSubscription(establishmentId);
        SubscriptionPayment payment = new SubscriptionPayment();
        payment.setSubscriptionId(subscription.getId());
        payment.setAmount(normalizedAmount.setScale(2, RoundingMode.HALF_UP));
        payment.setStatus("pending");
        payment.setPurpose(TOP_UP_PURPOSE);
        payment.setDueDate(LocalDate.now(ZoneOffset.UTC));
        payment.setPaymentMethod("pending");
        payment.setExternalReference("AI-TOPUP-" + UUID.randomUUID());
        paymentRepository.save(payment);
        return getDashboard(establishmentId);
    }

    @Transactional
    public AiBillingDashboardOutputDto confirmTopUp(String paymentId, String platformOwnerId) {
        SubscriptionPayment payment = paymentRepository.findByIdAndPurposeForUpdate(paymentId, TOP_UP_PURPOSE)
                .orElseThrow(() -> new IllegalArgumentException("Recarga não encontrada."));
        Subscription subscription = subscriptionRepository.findById(payment.getSubscriptionId())
                .orElseThrow(() -> new IllegalArgumentException("Assinatura da recarga não encontrada."));

        if (!"paid".equalsIgnoreCase(payment.getStatus())) {
            payment.setStatus("paid");
            payment.setPaidAt(Instant.now());
            payment.setPaymentMethod("manual_confirmation");
            paymentRepository.save(payment);
            credit(
                    subscription.getEstablishmentId(),
                    payment.getAmount(),
                    "Recarga de créditos de IA",
                    "topup:" + payment.getId(),
                    platformOwnerId,
                    "recharge"
            );
        }
        return getDashboard(subscription.getEstablishmentId());
    }

    @Transactional
    public AiBillingDashboardOutputDto addCredit(
            String establishmentId,
            BigDecimal amountBrl,
            String description,
            String platformOwnerId
    ) {
        requireActiveSubscription(establishmentId);
        BigDecimal normalizedAmount = positive(amountBrl, "O crédito deve ser maior que zero.")
                .setScale(MONEY_SCALE, RoundingMode.HALF_UP);
        credit(
                establishmentId,
                normalizedAmount,
                description == null || description.isBlank() ? "Crédito manual de IA" : description.trim(),
                "manual:" + UUID.randomUUID(),
                platformOwnerId,
                "adjustment"
        );
        return getDashboard(establishmentId);
    }

    @Transactional
    public AiBillingDashboardOutputDto getDashboard(String establishmentId) {
        Subscription subscription = subscriptionRepository.findFirstByEstablishmentIdOrderByCreatedAtDesc(establishmentId)
                .orElseThrow(() -> new IllegalArgumentException("Assinatura não encontrada."));
        AiCreditWallet wallet = walletRepository.findById(establishmentId)
                .orElseGet(() -> createWallet(establishmentId));
        List<AiUsageRecord> latestUsage = usageRepository.findByEstablishmentIdOrderByCreatedAtDesc(
                establishmentId,
                PageRequest.of(0, 100)
        );
        Instant monthStart = LocalDate.now(ZoneOffset.UTC)
                .with(TemporalAdjusters.firstDayOfMonth())
                .atStartOfDay(ZoneOffset.UTC)
                .toInstant();
        List<AiUsageRecord> currentMonthUsage = usageRepository
                .findByEstablishmentIdAndCreatedAtGreaterThanEqualOrderByCreatedAtDesc(establishmentId, monthStart);
        List<AiCreditTransaction> transactions = transactionRepository
                .findByEstablishmentIdOrderByCreatedAtDesc(establishmentId, PageRequest.of(0, 100));
        List<String> subscriptionIds = subscriptionRepository
                .findByEstablishmentIdOrderByCreatedAtDesc(establishmentId)
                .stream()
                .map(Subscription::getId)
                .toList();
        List<SubscriptionPayment> topUps = subscriptionIds.isEmpty()
                ? List.of()
                : paymentRepository.findBySubscriptionIdInAndPurposeOrderByCreatedAtDesc(subscriptionIds, TOP_UP_PURPOSE);

        return new AiBillingDashboardOutputDto(
                new WalletOutputDto(
                        wallet.getBalanceBrl(),
                        wallet.getTotalCreditedBrl(),
                        wallet.getTotalConsumedBrl(),
                        wallet.getUpdatedAt()
                ),
                new SubscriptionOutputDto(
                        subscription.getId(),
                        subscription.getPlanName(),
                        subscription.getStatus(),
                        subscription.getMonthlyAmount(),
                        subscription.getBillingDay(),
                        subscription.getCurrentPeriodEnd()
                ),
                summarize(currentMonthUsage),
                latestUsage.stream().map(this::toUsageOutput).toList(),
                transactions.stream().map(this::toTransactionOutput).toList(),
                topUps.stream().map(this::toTopUpOutput).toList()
        );
    }

    private void credit(
            String establishmentId,
            BigDecimal amountBrl,
            String description,
            String referenceId,
            String createdBy,
            String type
    ) {
        if (transactionRepository.findByReferenceIdAndTypeAndStatus(referenceId, type, "completed").isPresent()) {
            return;
        }
        AiCreditWallet wallet = lockedWallet(establishmentId);
        wallet.setBalanceBrl(wallet.getBalanceBrl().add(amountBrl));
        wallet.setTotalCreditedBrl(wallet.getTotalCreditedBrl().add(amountBrl));
        walletRepository.save(wallet);

        AiCreditTransaction transaction = new AiCreditTransaction();
        transaction.setEstablishmentId(establishmentId);
        transaction.setType(type);
        transaction.setStatus("completed");
        transaction.setAmountBrl(amountBrl);
        transaction.setReservedAmountBrl(BigDecimal.ZERO);
        transaction.setBalanceAfterBrl(wallet.getBalanceBrl());
        transaction.setReferenceId(referenceId);
        transaction.setDescription(description);
        transaction.setCreatedBy(createdBy);
        transaction.setSettledAt(Instant.now());
        transactionRepository.save(transaction);
    }

    private AiCreditWallet lockedWallet(String establishmentId) {
        return walletRepository.findByEstablishmentIdForUpdate(establishmentId)
                .orElseGet(() -> createWallet(establishmentId));
    }

    private AiCreditWallet createWallet(String establishmentId) {
        AiCreditWallet wallet = new AiCreditWallet();
        wallet.setEstablishmentId(establishmentId);
        wallet.setBalanceBrl(BigDecimal.ZERO);
        wallet.setTotalCreditedBrl(BigDecimal.ZERO);
        wallet.setTotalConsumedBrl(BigDecimal.ZERO);
        return walletRepository.save(wallet);
    }

    private Subscription requireActiveSubscription(String establishmentId) {
        if (establishmentId == null || establishmentId.isBlank()) {
            throw new IllegalArgumentException("Usuário sem estabelecimento vinculado.");
        }
        Subscription subscription = subscriptionRepository.findFirstByEstablishmentIdOrderByCreatedAtDesc(establishmentId)
                .orElseThrow(() -> new IllegalArgumentException("Assinatura não encontrada."));
        if (!List.of("active", "trial").contains(subscription.getStatus().toLowerCase())) {
            throw new IllegalArgumentException("A assinatura precisa estar ativa para usar créditos de IA.");
        }
        return subscription;
    }

    private AiCreditTransaction pendingReservation(String transactionId) {
        return transactionRepository.findById(transactionId)
                .filter(transaction -> "pending".equals(transaction.getStatus()))
                .orElseThrow(() -> new IllegalStateException("Reserva de crédito de IA inválida ou já processada."));
    }

    private BigDecimal requireTopUpAmount(BigDecimal amountBrl) {
        BigDecimal amount = positive(amountBrl, "Informe um valor de recarga válido.");
        if (amount.compareTo(minimumTopUpBrl) < 0) {
            throw new IllegalArgumentException("A recarga mínima é de R$ " + minimumTopUpBrl.setScale(2));
        }
        if (amount.compareTo(new BigDecimal("100000")) > 0) {
            throw new IllegalArgumentException("A recarga máxima por solicitação é de R$ 100.000,00.");
        }
        return amount;
    }

    private UsageSummaryOutputDto summarize(List<AiUsageRecord> records) {
        return new UsageSummaryOutputDto(
                records.size(),
                records.stream().mapToLong(AiUsageRecord::getPromptTokens).sum(),
                records.stream().mapToLong(AiUsageRecord::getCompletionTokens).sum(),
                records.stream().mapToLong(AiUsageRecord::getTotalTokens).sum(),
                records.stream().mapToLong(AiUsageRecord::getCachedTokens).sum(),
                records.stream().map(AiUsageRecord::getOpenRouterCostUsd).reduce(BigDecimal.ZERO, BigDecimal::add),
                records.stream().map(AiUsageRecord::getUpstreamInferenceCostUsd).reduce(BigDecimal.ZERO, BigDecimal::add),
                records.stream().map(AiUsageRecord::getChargedAmountBrl).reduce(BigDecimal.ZERO, BigDecimal::add)
        );
    }

    private UsageOutputDto toUsageOutput(AiUsageRecord record) {
        return new UsageOutputDto(
                record.getId(), record.getGenerationId(), record.getFeature(), record.getModel(),
                record.getPromptTokens(), record.getCompletionTokens(), record.getTotalTokens(),
                record.getReasoningTokens(), record.getCachedTokens(), record.getOpenRouterCostUsd(),
                record.getUpstreamInferenceCostUsd(),
                record.getUsdToBrlRate(), record.getMarkupPercent(), record.getChargedAmountBrl(), record.getCreatedAt()
        );
    }

    private TransactionOutputDto toTransactionOutput(AiCreditTransaction transaction) {
        return new TransactionOutputDto(
                transaction.getId(), transaction.getType(), transaction.getStatus(), transaction.getAmountBrl(),
                transaction.getBalanceAfterBrl(), transaction.getDescription(), transaction.getCreatedAt(),
                transaction.getSettledAt()
        );
    }

    private TopUpOutputDto toTopUpOutput(SubscriptionPayment payment) {
        return new TopUpOutputDto(
                payment.getId(), payment.getAmount(), payment.getStatus(), payment.getDueDate(), payment.getPaidAt(),
                payment.getPaymentMethod(), payment.getCreatedAt()
        );
    }

    private static BigDecimal positive(BigDecimal value, String message) {
        if (value == null || value.compareTo(BigDecimal.ZERO) <= 0) throw new IllegalArgumentException(message);
        return value;
    }

    private static BigDecimal nonNegative(BigDecimal value, String message) {
        if (value == null || value.compareTo(BigDecimal.ZERO) < 0) throw new IllegalArgumentException(message);
        return value;
    }

    private static long safeTokenCount(Long value) {
        return value == null || value < 0 ? 0 : value;
    }

    private static String blankToNull(String value) {
        return value == null || value.isBlank() ? null : value;
    }

    public record Reservation(String transactionId, String establishmentId, String userId) {}
    public record BillingReceipt(BigDecimal chargedAmountBrl, BigDecimal balanceAfterBrl) {}
}
