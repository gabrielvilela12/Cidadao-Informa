package br.com.fiap.hackgov.application.service;

import br.com.fiap.hackgov.domain.campaign.RegionalCampaign;
import br.com.fiap.hackgov.domain.entity.Establishment;
import br.com.fiap.hackgov.infrastructure.persistence.repository.JpaRegionalCampaignRepository;
import br.com.fiap.hackgov.infrastructure.persistence.repository.JpaSubscriptionRepository;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertSame;
import static org.mockito.ArgumentMatchers.anySet;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class RegionalCampaignRoutingServiceTest {

    @Test
    void publicRegistrationSkipsDemoButDemoCitizenCanCreateInOwnCampaign() {
        JpaRegionalCampaignRepository campaigns = mock(JpaRegionalCampaignRepository.class);
        JpaSubscriptionRepository subscriptions = mock(JpaSubscriptionRepository.class);
        RegionalCampaignRoutingService routing = new RegionalCampaignRoutingService(campaigns, subscriptions);
        RegionalCampaign demo = campaign("campaign-demo", "est-demo", true);
        RegionalCampaign municipal = campaign("campaign-municipal", "est-municipal", false);

        when(campaigns.findByStateIgnoreCaseAndStatusIgnoreCaseOrderByCreatedAtDesc("SP", "active"))
                .thenReturn(List.of(demo, municipal));
        when(campaigns.findByEstablishmentIdAndStatusIgnoreCaseOrderByCreatedAtDesc("est-demo", "active"))
                .thenReturn(List.of(demo));
        when(subscriptions.countEnabledByEstablishmentId(eq("est-demo"), anySet())).thenReturn(1L);
        when(subscriptions.countEnabledByEstablishmentId(eq("est-municipal"), anySet())).thenReturn(1L);

        assertSame(municipal, routing.resolveActiveCampaignForRegistration(
                "Ribeirão Preto", "Rua São José, 10 - Ribeirão Preto - SP", "SP"));
        assertSame(demo, routing.resolveActiveCampaignForProtocol(
                "Ribeirão Preto", "Rua São José, 10 - Ribeirão Preto - SP", "SP", "est-demo"));
    }

    private RegionalCampaign campaign(String id, String establishmentId, boolean demo) {
        RegionalCampaign campaign = new RegionalCampaign();
        campaign.setId(id);
        campaign.setEstablishmentId(establishmentId);
        campaign.setName("Campanha Ribeirão Preto");
        campaign.setScopeType("city");
        campaign.setCity("Ribeirão Preto");
        campaign.setState("SP");
        campaign.setStatus("active");
        campaign.setDemo(demo);
        Establishment establishment = new Establishment();
        establishment.setStatus("active");
        campaign.setEstablishment(establishment);
        return campaign;
    }
}
