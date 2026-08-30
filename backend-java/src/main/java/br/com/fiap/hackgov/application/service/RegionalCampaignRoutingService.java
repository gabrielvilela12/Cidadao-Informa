package br.com.fiap.hackgov.application.service;

import br.com.fiap.hackgov.domain.campaign.RegionalCampaign;
import br.com.fiap.hackgov.infrastructure.persistence.repository.JpaRegionalCampaignRepository;
import br.com.fiap.hackgov.infrastructure.persistence.repository.JpaSubscriptionRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.text.Normalizer;
import java.time.Instant;
import java.util.List;
import java.util.Locale;
import java.util.Set;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Service
public class RegionalCampaignRoutingService {

    private static final Set<String> ENABLED_SUBSCRIPTION_STATUSES = Set.of("active", "trial");

    private final JpaRegionalCampaignRepository campaignRepository;
    private final JpaSubscriptionRepository subscriptionRepository;

    public RegionalCampaignRoutingService(
            JpaRegionalCampaignRepository campaignRepository,
            JpaSubscriptionRepository subscriptionRepository
    ) {
        this.campaignRepository = campaignRepository;
        this.subscriptionRepository = subscriptionRepository;
    }

    @Transactional(readOnly = true)
    public RegionalCampaign resolveActiveCampaign(String city, String address, String stateCode) {
        String state = stateCode == null ? "" : stateCode.trim().toUpperCase(Locale.ROOT);
        if (state.isBlank()) {
            throw new IllegalArgumentException("Não foi possível identificar a UF da ocorrência.");
        }

        String resolvedCity = resolveCity(city, address, state);
        String normalizedCity = comparable(resolvedCity);
        if (normalizedCity.isBlank()) {
            throw new IllegalArgumentException("Não foi possível identificar a cidade da ocorrência.");
        }

        List<RegionalCampaign> candidates = campaignRepository
                .findByStateIgnoreCaseAndStatusIgnoreCaseOrderByCreatedAtDesc(state, "active")
                .stream()
                .filter(this::isCampaignRunning)
                .filter(this::hasEnabledSubscription)
                .toList();

        return candidates.stream()
                .filter(campaign -> "city".equalsIgnoreCase(campaign.getScopeType()))
                .filter(campaign -> normalizedCity.equals(comparable(campaign.getCity())))
                .findFirst()
                .or(() -> candidates.stream()
                        .filter(campaign -> "state".equalsIgnoreCase(campaign.getScopeType()))
                        .findFirst())
                .orElseThrow(() -> new IllegalArgumentException(
                        "Ainda não existe campanha ativa para a região informada. Nenhum protocolo foi salvo."
                ));
    }

    private boolean isCampaignRunning(RegionalCampaign campaign) {
        if (campaign == null || campaign.getEstablishmentId() == null || campaign.getEstablishmentId().isBlank()) {
            return false;
        }
        if (campaign.getEstablishment() == null || !"active".equalsIgnoreCase(campaign.getEstablishment().getStatus())) {
            return false;
        }
        Instant now = Instant.now();
        return (campaign.getStartsAt() == null || !campaign.getStartsAt().isAfter(now))
                && (campaign.getEndsAt() == null || campaign.getEndsAt().isAfter(now));
    }

    private boolean hasEnabledSubscription(RegionalCampaign campaign) {
        return subscriptionRepository.countEnabledByEstablishmentId(
                campaign.getEstablishmentId(),
                ENABLED_SUBSCRIPTION_STATUSES
        ) > 0;
    }

    private String resolveCity(String explicitCity, String address, String state) {
        if (explicitCity != null && !explicitCity.isBlank()) {
            return explicitCity.trim();
        }
        if (address == null || address.isBlank()) {
            return "";
        }

        Pattern cityStatePattern = Pattern.compile(
                "(?:^|,\\s*)([^,]+?)\\s+-\\s*" + Pattern.quote(state) + "\\s*$",
                Pattern.CASE_INSENSITIVE
        );
        Matcher matcher = cityStatePattern.matcher(stripAccents(address));
        return matcher.find() ? matcher.group(1).trim() : "";
    }

    private String comparable(String value) {
        return stripAccents(value)
                .trim()
                .toLowerCase(Locale.ROOT)
                .replaceAll("[^a-z0-9]+", " ")
                .replaceAll("\\s+", " ")
                .trim();
    }

    private String stripAccents(String value) {
        return Normalizer.normalize(value == null ? "" : value, Normalizer.Form.NFD)
                .replaceAll("\\p{M}", "");
    }
}
