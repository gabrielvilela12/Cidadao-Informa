package br.com.fiap.hackgov.application.service;

import br.com.fiap.hackgov.application.dto.adminmaster.CreateSubscriptionInputDto;
import br.com.fiap.hackgov.application.dto.adminmaster.EstablishmentDetailsOutputDto.PaymentOutputDto;
import br.com.fiap.hackgov.application.dto.adminmaster.PlatformOverviewOutputDto;
import br.com.fiap.hackgov.application.dto.adminmaster.PlatformOverviewOutputDto.EstablishmentSubscriptionOutputDto;
import br.com.fiap.hackgov.application.util.AuthUtils;
import br.com.fiap.hackgov.domain.billing.Subscription;
import br.com.fiap.hackgov.domain.campaign.RegionalCampaign;
import br.com.fiap.hackgov.domain.entity.Establishment;
import br.com.fiap.hackgov.domain.entity.User;
import br.com.fiap.hackgov.domain.repository.UserRepository;
import br.com.fiap.hackgov.infrastructure.persistence.repository.JpaEstablishmentRepository;
import br.com.fiap.hackgov.infrastructure.persistence.repository.JpaRegionalCampaignRepository;
import br.com.fiap.hackgov.infrastructure.persistence.repository.JpaSubscriptionPaymentRepository;
import br.com.fiap.hackgov.infrastructure.persistence.repository.JpaSubscriptionRepository;
import br.com.fiap.hackgov.infrastructure.persistence.repository.JpaUserRepository;
import br.com.fiap.hackgov.infrastructure.security.RoleAccess;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Locale;
import java.util.Set;
import java.util.UUID;

@Service
public class PlatformOverviewService {

    private static final Set<String> SUBSCRIPTION_STATUSES = Set.of(
            "active",
            "trial",
            "overdue",
            "blocked",
            "canceled"
    );

    private final UserRepository userRepository;
    private final JpaUserRepository jpaUserRepository;
    private final JpaEstablishmentRepository establishmentRepository;
    private final JpaRegionalCampaignRepository campaignRepository;
    private final JpaSubscriptionRepository subscriptionRepository;
    private final JpaSubscriptionPaymentRepository paymentRepository;

    public PlatformOverviewService(
            UserRepository userRepository,
            JpaUserRepository jpaUserRepository,
            JpaEstablishmentRepository establishmentRepository,
            JpaRegionalCampaignRepository campaignRepository,
            JpaSubscriptionRepository subscriptionRepository,
            JpaSubscriptionPaymentRepository paymentRepository
    ) {
        this.userRepository = userRepository;
        this.jpaUserRepository = jpaUserRepository;
        this.establishmentRepository = establishmentRepository;
        this.campaignRepository = campaignRepository;
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

    @Transactional
    public PlatformOverviewOutputDto createSubscription(CreateSubscriptionInputDto input) {
        if (input == null) {
            throw new IllegalArgumentException("Informe os dados da nova assinatura.");
        }

        String establishmentName = required(input.establishmentName(), "Informe o nome da prefeitura.");
        String city = required(input.city(), "Informe a cidade da prefeitura.");
        String state = required(input.state(), "Informe a UF da prefeitura.").toUpperCase(Locale.ROOT);
        if (state.length() != 2) {
            throw new IllegalArgumentException("A UF deve ter exatamente 2 letras.");
        }

        String primaryColor = defaultWhenBlank(input.primaryColor(), "#0758BD");
        if (!primaryColor.matches("^#[0-9A-Fa-f]{6}$")) {
            throw new IllegalArgumentException("A cor principal deve estar no formato hexadecimal, como #0758BD.");
        }

        String campaignScope = defaultWhenBlank(input.campaignScope(), "city").toLowerCase(Locale.ROOT);
        if (!Set.of("city", "state").contains(campaignScope)) {
            throw new IllegalArgumentException("A campanha deve ser por cidade ou por estado.");
        }
        String campaignName = defaultWhenBlank(
                input.campaignName(),
                "Campanha " + ("state".equals(campaignScope) ? state : city + "/" + state)
        );

        String planName = defaultWhenBlank(input.planName(), "Essencial Prefeitura");
        String subscriptionStatus = defaultWhenBlank(input.subscriptionStatus(), "active").toLowerCase(Locale.ROOT);
        if (!SUBSCRIPTION_STATUSES.contains(subscriptionStatus)) {
            throw new IllegalArgumentException("Status de assinatura inválido.");
        }

        BigDecimal monthlyAmount = input.monthlyAmount() == null ? BigDecimal.ZERO : input.monthlyAmount();
        if (monthlyAmount.compareTo(BigDecimal.ZERO) < 0) {
            throw new IllegalArgumentException("A mensalidade não pode ser negativa.");
        }

        int billingDay = input.billingDay() == null ? 10 : input.billingDay();
        if (billingDay < 1 || billingDay > 28) {
            throw new IllegalArgumentException("O vencimento deve ficar entre os dias 1 e 28.");
        }

        Establishment establishment = new Establishment();
        establishment.setId(UUID.randomUUID().toString());
        establishment.setName(establishmentName);
        establishment.setType("city_hall");
        establishment.setDocument(blankToNull(input.document()));
        establishment.setCity(city);
        establishment.setState(state);
        establishment.setStatus("active");
        establishment.setPrimaryColor(primaryColor);
        establishment.setLogoUrl(blankToNull(input.logoUrl()));
        Establishment createdEstablishment = establishmentRepository.save(establishment);

        Instant now = Instant.now();
        Subscription subscription = new Subscription();
        subscription.setId(UUID.randomUUID().toString());
        subscription.setEstablishmentId(createdEstablishment.getId());
        subscription.setPlanName(planName);
        subscription.setStatus(subscriptionStatus);
        subscription.setMonthlyAmount(monthlyAmount);
        subscription.setBillingDay(billingDay);
        subscription.setStartedAt(now);
        subscription.setCurrentPeriodEnd(now.plus(30, ChronoUnit.DAYS));
        subscription.setCreatedAt(now);
        subscriptionRepository.save(subscription);

        RegionalCampaign campaign = new RegionalCampaign();
        campaign.setId(UUID.randomUUID().toString());
        campaign.setEstablishmentId(createdEstablishment.getId());
        campaign.setName(campaignName);
        campaign.setScopeType(campaignScope);
        campaign.setCity("city".equals(campaignScope) ? city : null);
        campaign.setState(state);
        campaign.setStatus("active");
        campaign.setStartsAt(now);
        campaign.setCreatedAt(now);
        campaignRepository.save(campaign);

        createOwnerIfPresent(input, createdEstablishment.getId());

        return getOverview();
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

    private void createOwnerIfPresent(CreateSubscriptionInputDto input, String establishmentId) {
        String ownerName = trim(input.ownerName());
        String ownerEmail = trim(input.ownerEmail()).toLowerCase(Locale.ROOT);
        String ownerCpf = onlyDigits(input.ownerCpf());
        String ownerPhone = onlyDigits(input.ownerPhone());
        String ownerPassword = trim(input.ownerPassword());

        boolean hasOwnerData = !ownerName.isBlank()
                || !ownerEmail.isBlank()
                || !ownerCpf.isBlank()
                || !ownerPhone.isBlank()
                || !ownerPassword.isBlank();

        if (!hasOwnerData) {
            return;
        }

        if (ownerName.isBlank()) {
            throw new IllegalArgumentException("Informe o nome do diretor responsável.");
        }
        if (ownerEmail.isBlank() || !ownerEmail.contains("@")) {
            throw new IllegalArgumentException("Informe um e-mail válido para o diretor responsável.");
        }
        if (ownerCpf.length() != 11) {
            throw new IllegalArgumentException("O CPF do diretor deve ter exatamente 11 dígitos.");
        }
        if (!ownerPhone.isBlank() && ownerPhone.length() != 10 && ownerPhone.length() != 11) {
            throw new IllegalArgumentException("O telefone do diretor deve ter 10 ou 11 dígitos.");
        }
        if (ownerPassword.length() < 6) {
            throw new IllegalArgumentException("A senha do diretor deve ter pelo menos 6 caracteres.");
        }
        if (userRepository.getByCpf(ownerCpf).isPresent()) {
            throw new IllegalArgumentException("Já existe uma conta cadastrada com este CPF.");
        }
        if (userRepository.getByEmail(ownerEmail).isPresent()) {
            throw new IllegalArgumentException("Já existe uma conta cadastrada com este E-mail.");
        }

        User owner = new User();
        owner.setId(UUID.randomUUID().toString());
        owner.setName(ownerName);
        owner.setEmail(ownerEmail);
        owner.setCpf(ownerCpf);
        owner.setPhone(ownerPhone.isBlank() ? null : ownerPhone);
        owner.setRole(RoleAccess.ESTABLISHMENT_OWNER);
        owner.setEstablishmentId(establishmentId);
        owner.setStatus("active");
        owner.setPasswordHash(AuthUtils.hashPassword(ownerPassword));
        userRepository.add(owner);
    }

    private String required(String value, String message) {
        String normalized = trim(value);
        if (normalized.isBlank()) {
            throw new IllegalArgumentException(message);
        }
        return normalized;
    }

    private String defaultWhenBlank(String value, String fallback) {
        String normalized = trim(value);
        return normalized.isBlank() ? fallback : normalized;
    }

    private String blankToNull(String value) {
        String normalized = trim(value);
        return normalized.isBlank() ? null : normalized;
    }

    private String trim(String value) {
        return value == null ? "" : value.trim();
    }

    private String onlyDigits(String value) {
        return trim(value).replaceAll("\\D", "");
    }
}
