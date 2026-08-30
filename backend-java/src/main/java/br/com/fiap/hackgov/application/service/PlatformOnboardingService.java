package br.com.fiap.hackgov.application.service;

import br.com.fiap.hackgov.application.dto.onboarding.CreateEstablishmentApplicationInputDto;
import br.com.fiap.hackgov.application.dto.onboarding.EstablishmentApplicationOutputDto;
import br.com.fiap.hackgov.application.dto.onboarding.PlatformPlanOutputDto;
import br.com.fiap.hackgov.application.dto.onboarding.ReviewEstablishmentApplicationInputDto;
import br.com.fiap.hackgov.application.util.AuthUtils;
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
import br.com.fiap.hackgov.infrastructure.persistence.repository.JpaSubscriptionRepository;
import br.com.fiap.hackgov.infrastructure.security.RoleAccess;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
public class PlatformOnboardingService {

    private static final Set<String> CAMPAIGN_SCOPES = Set.of("city", "state");

    private final JpaPlatformPlanRepository planRepository;
    private final JpaEstablishmentApplicationRepository applicationRepository;
    private final JpaEstablishmentRepository establishmentRepository;
    private final JpaRegionalCampaignRepository campaignRepository;
    private final JpaSubscriptionRepository subscriptionRepository;
    private final UserRepository userRepository;

    public PlatformOnboardingService(
            JpaPlatformPlanRepository planRepository,
            JpaEstablishmentApplicationRepository applicationRepository,
            JpaEstablishmentRepository establishmentRepository,
            JpaRegionalCampaignRepository campaignRepository,
            JpaSubscriptionRepository subscriptionRepository,
            UserRepository userRepository
    ) {
        this.planRepository = planRepository;
        this.applicationRepository = applicationRepository;
        this.establishmentRepository = establishmentRepository;
        this.campaignRepository = campaignRepository;
        this.subscriptionRepository = subscriptionRepository;
        this.userRepository = userRepository;
    }

    @Transactional(readOnly = true)
    public List<PlatformPlanOutputDto> listActivePlans() {
        return activePlans().stream()
                .map(PlatformPlanOutputDto::from)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<EstablishmentApplicationOutputDto> listApplications() {
        Map<String, PlatformPlan> plans = planRepository.findAll()
                .stream()
                .collect(Collectors.toMap(PlatformPlan::getCode, Function.identity()));

        return applicationRepository.findAllByOrderByCreatedAtDesc()
                .stream()
                .map(application -> toOutput(application, plans.get(application.getPlanCode())))
                .toList();
    }

    @Transactional
    public EstablishmentApplicationOutputDto createApplication(CreateEstablishmentApplicationInputDto input) {
        if (input == null) {
            throw new IllegalArgumentException("Informe os dados da prefeitura.");
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
        if (!CAMPAIGN_SCOPES.contains(campaignScope)) {
            throw new IllegalArgumentException("A cobertura deve ser por cidade ou por estado.");
        }

        String requesterName = required(input.requesterName(), "Informe o nome do responsável.");
        String requesterEmail = required(input.requesterEmail(), "Informe o e-mail do responsável.").toLowerCase(Locale.ROOT);
        if (!requesterEmail.contains("@")) {
            throw new IllegalArgumentException("Informe um e-mail válido para o responsável.");
        }
        String requesterCpf = onlyDigits(input.requesterCpf());
        if (requesterCpf.length() != 11) {
            throw new IllegalArgumentException("O CPF do responsável deve ter exatamente 11 dígitos.");
        }
        String requesterPhone = onlyDigits(input.requesterPhone());
        if (!requesterPhone.isBlank() && requesterPhone.length() != 10 && requesterPhone.length() != 11) {
            throw new IllegalArgumentException("O telefone do responsável deve ter 10 ou 11 dígitos.");
        }
        String requesterPassword = trim(input.requesterPassword());
        if (requesterPassword.length() < 6) {
            throw new IllegalArgumentException("A senha do responsável deve ter pelo menos 6 caracteres.");
        }

        PlatformPlan plan = planRepository.findById(required(input.planCode(), "Escolha um plano."))
                .filter(candidate -> "active".equalsIgnoreCase(candidate.getStatus()))
                .orElseThrow(() -> new IllegalArgumentException("Plano indisponível."));

        if (userRepository.getByCpf(requesterCpf).isPresent()) {
            throw new IllegalArgumentException("Já existe uma conta cadastrada com este CPF.");
        }
        if (userRepository.getByEmail(requesterEmail).isPresent()) {
            throw new IllegalArgumentException("Já existe uma conta cadastrada com este e-mail.");
        }

        User requester = new User();
        requester.setId(UUID.randomUUID().toString());
        requester.setName(requesterName);
        requester.setEmail(requesterEmail);
        requester.setCpf(requesterCpf);
        requester.setPhone(requesterPhone.isBlank() ? null : requesterPhone);
        requester.setRole(RoleAccess.ESTABLISHMENT_OWNER);
        requester.setStatus("pending");
        requester.setPasswordHash(AuthUtils.hashPassword(requesterPassword));
        User createdRequester = userRepository.add(requester);

        EstablishmentApplication application = new EstablishmentApplication();
        application.setId(UUID.randomUUID().toString());
        application.setEstablishmentName(establishmentName);
        application.setDocument(blankToNull(input.document()));
        application.setCity(city);
        application.setState(state);
        application.setPrimaryColor(primaryColor);
        application.setLogoUrl(blankToNull(input.logoUrl()));
        application.setCampaignName(blankToNull(input.campaignName()));
        application.setCampaignScope(campaignScope);
        application.setPlanCode(plan.getCode());
        application.setRequesterUserId(createdRequester.getId());
        application.setStatus("pending");

        return toOutput(applicationRepository.save(application), plan);
    }

    @Transactional
    public EstablishmentApplicationOutputDto approve(String applicationId, String reviewerUserId) {
        EstablishmentApplication application = pendingApplication(applicationId);
        PlatformPlan plan = planRepository.findById(application.getPlanCode())
                .orElseThrow(() -> new IllegalArgumentException("Plano da solicitação não encontrado."));
        User requester = userRepository.getById(application.getRequesterUserId())
                .orElseThrow(() -> new IllegalArgumentException("Responsável da solicitação não encontrado."));

        Instant now = Instant.now();

        Establishment establishment = new Establishment();
        establishment.setId(UUID.randomUUID().toString());
        establishment.setName(application.getEstablishmentName());
        establishment.setType("city_hall");
        establishment.setDocument(application.getDocument());
        establishment.setCity(application.getCity());
        establishment.setState(application.getState());
        establishment.setStatus("active");
        establishment.setPrimaryColor(application.getPrimaryColor());
        establishment.setLogoUrl(application.getLogoUrl());
        Establishment createdEstablishment = establishmentRepository.save(establishment);

        Subscription subscription = new Subscription();
        subscription.setId(UUID.randomUUID().toString());
        subscription.setEstablishmentId(createdEstablishment.getId());
        subscription.setPlanName(plan.getName());
        subscription.setStatus("active");
        subscription.setMonthlyAmount(BigDecimal.ZERO);
        subscription.setBillingDay(10);
        subscription.setStartedAt(now);
        subscription.setCurrentPeriodEnd(now.plus(30, ChronoUnit.DAYS));
        subscription.setCreatedAt(now);
        Subscription createdSubscription = subscriptionRepository.save(subscription);

        RegionalCampaign campaign = new RegionalCampaign();
        campaign.setId(UUID.randomUUID().toString());
        campaign.setEstablishmentId(createdEstablishment.getId());
        campaign.setName(defaultWhenBlank(
                application.getCampaignName(),
                "Campanha " + ("state".equals(application.getCampaignScope())
                        ? application.getState()
                        : application.getCity() + "/" + application.getState())
        ));
        campaign.setScopeType(application.getCampaignScope());
        campaign.setCity("city".equals(application.getCampaignScope()) ? application.getCity() : null);
        campaign.setState(application.getState());
        campaign.setStatus("active");
        campaign.setStartsAt(now);
        campaign.setCreatedAt(now);
        RegionalCampaign createdCampaign = campaignRepository.save(campaign);

        requester.setRole(RoleAccess.ESTABLISHMENT_OWNER);
        requester.setEstablishmentId(createdEstablishment.getId());
        requester.setStatus("active");
        userRepository.update(requester);

        application.setStatus("approved");
        application.setReviewedBy(reviewerUserId);
        application.setReviewedAt(now);
        application.setCreatedEstablishmentId(createdEstablishment.getId());
        application.setCreatedSubscriptionId(createdSubscription.getId());
        application.setCreatedCampaignId(createdCampaign.getId());
        application.setRejectionReason(null);

        return toOutput(applicationRepository.save(application), plan);
    }

    @Transactional
    public EstablishmentApplicationOutputDto reject(
            String applicationId,
            String reviewerUserId,
            ReviewEstablishmentApplicationInputDto input
    ) {
        EstablishmentApplication application = pendingApplication(applicationId);
        PlatformPlan plan = planRepository.findById(application.getPlanCode()).orElse(null);
        userRepository.getById(application.getRequesterUserId()).ifPresent(user -> {
            user.setStatus("rejected");
            userRepository.update(user);
        });

        application.setStatus("rejected");
        application.setReviewedBy(reviewerUserId);
        application.setReviewedAt(Instant.now());
        application.setRejectionReason(defaultWhenBlank(input == null ? null : input.reason(), "Solicitação recusada."));

        return toOutput(applicationRepository.save(application), plan);
    }

    private EstablishmentApplication pendingApplication(String applicationId) {
        EstablishmentApplication application = applicationRepository.findById(applicationId)
                .orElseThrow(() -> new IllegalArgumentException("Solicitação não encontrada."));
        if (!"pending".equalsIgnoreCase(application.getStatus())) {
            throw new IllegalArgumentException("Esta solicitação já foi analisada.");
        }
        return application;
    }

    private List<PlatformPlan> activePlans() {
        List<PlatformPlan> plans = planRepository.findByStatusIgnoreCaseOrderBySortOrderAscNameAsc("active");
        if (plans.isEmpty()) {
            throw new IllegalArgumentException("Nenhum plano ativo foi configurado.");
        }
        return plans;
    }

    private EstablishmentApplicationOutputDto toOutput(EstablishmentApplication application, PlatformPlan plan) {
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
