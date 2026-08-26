package br.com.fiap.hackgov.application.service;

import br.com.fiap.hackgov.application.dto.adminmaster.PlatformOverviewOutputDto;
import br.com.fiap.hackgov.application.dto.adminmaster.PlatformOverviewOutputDto.EstablishmentSubscriptionOutputDto;
import br.com.fiap.hackgov.domain.billing.Subscription;
import br.com.fiap.hackgov.domain.entity.Establishment;
import br.com.fiap.hackgov.domain.repository.UserRepository;
import br.com.fiap.hackgov.infrastructure.persistence.repository.JpaEstablishmentRepository;
import br.com.fiap.hackgov.infrastructure.persistence.repository.JpaSubscriptionPaymentRepository;
import br.com.fiap.hackgov.infrastructure.persistence.repository.JpaSubscriptionRepository;
import br.com.fiap.hackgov.infrastructure.persistence.repository.JpaUserRepository;
import br.com.fiap.hackgov.infrastructure.security.RoleAccess;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.List;

@Service
public class PlatformOverviewService {

    private final UserRepository userRepository;
    private final JpaUserRepository jpaUserRepository;
    private final JpaEstablishmentRepository establishmentRepository;
    private final JpaSubscriptionRepository subscriptionRepository;
    private final JpaSubscriptionPaymentRepository paymentRepository;

    public PlatformOverviewService(
            UserRepository userRepository,
            JpaUserRepository jpaUserRepository,
            JpaEstablishmentRepository establishmentRepository,
            JpaSubscriptionRepository subscriptionRepository,
            JpaSubscriptionPaymentRepository paymentRepository
    ) {
        this.userRepository = userRepository;
        this.jpaUserRepository = jpaUserRepository;
        this.establishmentRepository = establishmentRepository;
        this.subscriptionRepository = subscriptionRepository;
        this.paymentRepository = paymentRepository;
    }

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
                monthlyRecurringRevenue,
                pendingRevenue == null ? BigDecimal.ZERO : pendingRevenue,
                establishmentSubscriptions
        );
    }

    private EstablishmentSubscriptionOutputDto toOutput(Subscription subscription) {
        Establishment establishment = subscription.getEstablishment();
        String establishmentId = subscription.getEstablishmentId();

        return new EstablishmentSubscriptionOutputDto(
                establishmentId,
                establishment == null ? "Estabelecimento não encontrado" : establishment.getName(),
                establishment == null ? "city_hall" : establishment.getType(),
                establishment == null ? "" : establishment.getCity(),
                establishment == null ? "" : establishment.getState(),
                establishment == null ? "inactive" : establishment.getStatus(),
                establishment == null ? "#0758BD" : establishment.getPrimaryColor(),
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

    private long countRole(String establishmentId, String role) {
        if (establishmentId == null || establishmentId.isBlank()) {
            return 0;
        }
        return jpaUserRepository.countByEstablishmentIdAndRoleIgnoreCase(establishmentId, role);
    }
}
