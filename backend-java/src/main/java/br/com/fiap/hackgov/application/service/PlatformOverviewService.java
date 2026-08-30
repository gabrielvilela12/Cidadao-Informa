package br.com.fiap.hackgov.application.service;

import br.com.fiap.hackgov.application.dto.adminmaster.EstablishmentDetailsOutputDto.PaymentOutputDto;
import br.com.fiap.hackgov.application.dto.adminmaster.PlatformOverviewOutputDto;
import br.com.fiap.hackgov.application.dto.adminmaster.PlatformOverviewOutputDto.EstablishmentSubscriptionOutputDto;
import br.com.fiap.hackgov.application.dto.onboarding.EstablishmentApplicationOutputDto;
import br.com.fiap.hackgov.application.dto.onboarding.PlatformPlanOutputDto;
import br.com.fiap.hackgov.domain.billing.PlatformPlan;
import br.com.fiap.hackgov.domain.billing.Subscription;
import br.com.fiap.hackgov.domain.campaign.RegionalCampaign;
import br.com.fiap.hackgov.domain.entity.Establishment;
import br.com.fiap.hackgov.domain.entity.User;
import br.com.fiap.hackgov.domain.onboarding.EstablishmentApplication;
import br.com.fiap.hackgov.domain.repository.UserRepository;
import br.com.fiap.hackgov.infrastructure.persistence.repository.JpaEstablishmentApplicationRepository;
import br.com.fiap.hackgov.infrastructure.persistence.repository.JpaEstablishmentRepository;
import br.com.fiap.hackgov.infrastructure.persistence.repository.JpaPlatformPlanRepository;
import br.com.fiap.hackgov.infrastructure.persistence.repository.JpaRegionalCampaignRepository;
import br.com.fiap.hackgov.infrastructure.persistence.repository.JpaSubscriptionPaymentRepository;
import br.com.fiap.hackgov.infrastructure.persistence.repository.JpaSubscriptionRepository;
import br.com.fiap.hackgov.infrastructure.persistence.repository.JpaUserRepository;
import br.com.fiap.hackgov.infrastructure.security.RoleAccess;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
public class PlatformOverviewService {

    private final UserRepository userRepository;
    private final JpaUserRepository jpaUserRepository;
    private final JpaEstablishmentRepository establishmentRepository;
    private final JpaRegionalCampaignRepository campaignRepository;
    private final JpaSubscriptionRepository subscriptionRepository;
    private final JpaSubscriptionPaymentRepository paymentRepository;
    private final JpaPlatformPlanRepository planRepository;
    private final JpaEstablishmentApplicationRepository applicationRepository;

    public PlatformOverviewService(
            UserRepository userRepository,
            JpaUserRepository jpaUserRepository,
            JpaEstablishmentRepository establishmentRepository,
            JpaRegionalCampaignRepository campaignRepository,
            JpaSubscriptionRepository subscriptionRepository,
            JpaSubscriptionPaymentRepository paymentRepository,
            JpaPlatformPlanRepository planRepository,
            JpaEstablishmentApplicationRepository applicationRepository
    ) {
        this.userRepository = userRepository;
        this.jpaUserRepository = jpaUserRepository;
        this.establishmentRepository = establishmentRepository;
        this.campaignRepository = campaignRepository;
        this.subscriptionRepository = subscriptionRepository;
        this.paymentRepository = paymentRepository;
        this.planRepository = planRepository;
        this.applicationRepository = applicationRepository;
    }

    @Transactional(readOnly = true)
    public PlatformOverviewOutputDto getOverview() {
        List<Subscription> subscriptions = subscriptionRepository.findAllByOrderByCreatedAtDesc();
        BigDecimal monthlyRecurringRevenue = subscriptions.stream()
                .filter(subscription -> "active".equalsIgnoreCase(subscription.getStatus()))
                .map(Subscription::getMonthlyAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        List<EstablishmentSubscriptionOutputDto> establishmentSubscriptions = subscriptions.stream()
                .map(this::toOutput)
                .toList();
        BigDecimal pendingRevenue = paymentRepository.sumAmountByStatusIn(List.of("pending", "overdue"));
        List<PlatformPlanOutputDto> plans = planRepository
                .findByStatusIgnoreCaseOrderBySortOrderAscNameAsc("active")
                .stream()
                .map(PlatformPlanOutputDto::from)
                .toList();
        List<EstablishmentApplicationOutputDto> establishmentApplications = applicationOutputs();

        return new PlatformOverviewOutputDto(
                userRepository.countAll(),
                userRepository.countByRole(RoleAccess.CITIZEN),
                userRepository.countByRole(RoleAccess.PLATFORM_OWNER) + userRepository.countByRole("master"),
                userRepository.countByRole(RoleAccess.ESTABLISHMENT_OWNER),
                userRepository.countByRole(RoleAccess.ADMIN),
                establishmentRepository.count(),
                establishmentRepository.countByStatusIgnoreCase("active"),
                subscriptionRepository.countByStatusIgnoreCase("active"),
                subscriptionRepository.countByStatusIgnoreCase("overdue"),
                paymentRepository.countByStatusIgnoreCase("pending")
                        + paymentRepository.countByStatusIgnoreCase("overdue"),
                applicationRepository.countByStatusIgnoreCase("pending"),
                monthlyRecurringRevenue,
                pendingRevenue == null ? BigDecimal.ZERO : pendingRevenue,
                plans,
                establishmentApplications,
                establishmentSubscriptions
        );
    }

    @Transactional(readOnly = true)
    public EstablishmentSubscriptionOutputDto getEstablishmentSubscription(String establishmentId) {
        return subscriptionRepository.findFirstByEstablishmentIdOrderByCreatedAtDesc(establishmentId)
                .map(this::toOutput)
                .orElseThrow(() -> new IllegalArgumentException("Estabelecimento não encontrado."));
    }

    @Transactional(readOnly = true)
    public List<PaymentOutputDto> getEstablishmentPayments(String establishmentId) {
        List<String> subscriptionIds = subscriptionRepository
                .findByEstablishmentIdOrderByCreatedAtDesc(establishmentId)
                .stream()
                .map(Subscription::getId)
                .toList();
        if (subscriptionIds.isEmpty()) {
            return List.of();
        }
        return paymentRepository
                .findBySubscriptionIdInOrderByDueDateDescCreatedAtDesc(subscriptionIds)
                .stream()
                .map(PaymentOutputDto::from)
                .toList();
    }

    private EstablishmentSubscriptionOutputDto toOutput(Subscription subscription) {
        Establishment establishment = subscription.getEstablishment();
        String establishmentId = subscription.getEstablishmentId();
        RegionalCampaign campaign = activeCampaign(establishmentId);

        return new EstablishmentSubscriptionOutputDto(
                establishmentId,
                establishment == null ? "Estabelecimento não encontrado" : establishment.getName(),
                establishment == null ? "city_hall" : establishment.getType(),
                establishment == null ? "" : establishment.getCity(),
                establishment == null ? "" : establishment.getState(),
                establishment == null ? "inactive" : establishment.getStatus(),
                establishment == null ? "#0758BD" : establishment.getPrimaryColor(),
                campaign == null ? null : campaign.getName(),
                campaign == null ? null : campaign.getScopeType(),
                campaign == null ? null : campaign.getCity(),
                campaign == null ? null : campaign.getState(),
                subscription.getId(),
                subscription.getPlanName(),
                subscription.getStatus(),
                subscription.getMonthlyAmount(),
                subscription.getBillingDay(),
                subscription.getCurrentPeriodEnd(),
                countRole(establishmentId, RoleAccess.ESTABLISHMENT_OWNER),
                countRole(establishmentId, RoleAccess.ADMIN),
                countRole(establishmentId, RoleAccess.CITIZEN)
        );
    }

    private List<EstablishmentApplicationOutputDto> applicationOutputs() {
        Map<String, PlatformPlan> plans = planRepository.findAll()
                .stream()
                .collect(Collectors.toMap(PlatformPlan::getCode, Function.identity()));

        return applicationRepository.findAllByOrderByCreatedAtDesc()
                .stream()
                .map(application -> toApplicationOutput(application, plans.get(application.getPlanCode())))
                .toList();
    }

    private EstablishmentApplicationOutputDto toApplicationOutput(EstablishmentApplication application, PlatformPlan plan) {
        User requester = userRepository.getById(application.getRequesterUserId()).orElse(null);
        return new EstablishmentApplicationOutputDto(
                application.getId(),
                application.getEstablishmentName(),
                application.getDocument(),
                application.getCity(),
                application.getState(),
                application.getPrimaryColor(),
                application.getLogoUrl(),
                application.getCampaignName(),
                application.getCampaignScope(),
                application.getPlanCode(),
                plan == null ? application.getPlanCode() : plan.getName(),
                requester == null ? "" : requester.getName(),
                requester == null ? "" : requester.getEmail(),
                requester == null ? "" : requester.getCpf(),
                requester == null ? "" : requester.getPhone(),
                application.getStatus(),
                application.getRejectionReason(),
                application.getCreatedEstablishmentId(),
                application.getCreatedSubscriptionId(),
                application.getCreatedCampaignId(),
                application.getReviewedAt(),
                application.getCreatedAt()
        );
    }

    private long countRole(String establishmentId, String role) {
        if (establishmentId == null || establishmentId.isBlank()) {
            return 0;
        }
        return jpaUserRepository.countByEstablishmentIdAndRoleIgnoreCase(establishmentId, role);
    }

    private RegionalCampaign activeCampaign(String establishmentId) {
        if (establishmentId == null || establishmentId.isBlank()) {
            return null;
        }
        return campaignRepository
                .findByEstablishmentIdAndStatusIgnoreCaseOrderByCreatedAtDesc(establishmentId, "active")
                .stream()
                .findFirst()
                .orElse(null);
    }

}
