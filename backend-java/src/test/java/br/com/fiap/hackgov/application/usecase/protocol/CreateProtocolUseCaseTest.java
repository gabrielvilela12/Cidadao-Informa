package br.com.fiap.hackgov.application.usecase.protocol;

import br.com.fiap.hackgov.application.dto.protocol.ProtocolInputDto;
import br.com.fiap.hackgov.application.service.RegionalCampaignRoutingService;
import br.com.fiap.hackgov.application.service.ServerStatePermissionService;
import br.com.fiap.hackgov.domain.campaign.RegionalCampaign;
import br.com.fiap.hackgov.domain.entity.Protocol;
import br.com.fiap.hackgov.domain.repository.ProtocolRepository;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class CreateProtocolUseCaseTest {

    @Test
    void newReportInheritsStatusFromSameCauseAtSameLocation() {
        ProtocolRepository repository = mock(ProtocolRepository.class);
        ServerStatePermissionService permissions = mock(ServerStatePermissionService.class);
        RegionalCampaignRoutingService campaignRouting = mock(RegionalCampaignRoutingService.class);
        CreateProtocolUseCase useCase = new CreateProtocolUseCase(repository, permissions, campaignRouting);
        Protocol existing = new Protocol();
        existing.setStatus("Em Análise");
        when(permissions.resolveState("SP", "Praça da Sé, 10 - Sé, São Paulo - SP")).thenReturn("SP");
        when(campaignRouting.resolveActiveCampaign("São Paulo", "Praça da Sé, 10 - Sé, São Paulo - SP", "SP"))
                .thenReturn(campaign("campaign-sp", "est-sp"));
        when(repository.getByLocationAndCause(
                "praca da se 10 se sao paulo sp",
                "fisica|calcada sem rampa"
        )).thenReturn(List.of(existing));
        when(repository.add(any(Protocol.class))).thenAnswer(invocation -> {
            Protocol created = invocation.getArgument(0);
            created.setId("new-protocol");
            created.prePersist();
            return created;
        });

        var output = useCase.execute(new ProtocolInputDto(
                "Física",
                "Calçada sem rampa - Bloqueia a entrada do posto",
                "Praça da Sé, 10 - Sé, São Paulo - SP",
                "São Paulo",
                "SP",
                -23.5505,
                -46.6333,
                List.of()
        ), "citizen-2", "Maria");

        assertEquals("Em Análise", output.status());
    }

    @Test
    void differentCauseAtSameLocationStartsOpen() {
        ProtocolRepository repository = mock(ProtocolRepository.class);
        ServerStatePermissionService permissions = mock(ServerStatePermissionService.class);
        RegionalCampaignRoutingService campaignRouting = mock(RegionalCampaignRoutingService.class);
        CreateProtocolUseCase useCase = new CreateProtocolUseCase(repository, permissions, campaignRouting);
        when(permissions.resolveState("SP", "Praça da Sé, 10 - Sé, São Paulo - SP")).thenReturn("SP");
        when(campaignRouting.resolveActiveCampaign("São Paulo", "Praça da Sé, 10 - Sé, São Paulo - SP", "SP"))
                .thenReturn(campaign("campaign-sp", "est-sp"));
        when(repository.getByLocationAndCause(
                "praca da se 10 se sao paulo sp",
                "visual|piso tatil interrompido"
        )).thenReturn(List.of());
        when(repository.add(any(Protocol.class))).thenAnswer(invocation -> {
            Protocol created = invocation.getArgument(0);
            created.setId("new-protocol");
            created.prePersist();
            return created;
        });

        var output = useCase.execute(new ProtocolInputDto(
                "Visual",
                "Piso tátil interrompido - Em frente ao portão",
                "Praça da Sé, 10 - Sé, São Paulo - SP",
                "São Paulo",
                "SP",
                -23.5505,
                -46.6333,
                List.of()
        ), "citizen-3", "João");

        assertEquals("Aberto", output.status());
    }

    @Test
    void routesProtocolToReportedRegionCampaignInsteadOfUserRegion() {
        ProtocolRepository repository = mock(ProtocolRepository.class);
        ServerStatePermissionService permissions = mock(ServerStatePermissionService.class);
        RegionalCampaignRoutingService campaignRouting = mock(RegionalCampaignRoutingService.class);
        CreateProtocolUseCase useCase = new CreateProtocolUseCase(repository, permissions, campaignRouting);
        String address = "Rua 10, 25 - Centro, Goiânia - GO";
        when(permissions.resolveState("GO", address)).thenReturn("GO");
        when(campaignRouting.resolveActiveCampaign("Goiânia", address, "GO"))
                .thenReturn(campaign("campaign-go", "est-goiania"));
        when(repository.getByLocationAndCause(
                "rua 10 25 centro goiania go",
                "fisica|rampa bloqueada"
        )).thenReturn(List.of());
        when(repository.add(any(Protocol.class))).thenAnswer(invocation -> {
            Protocol created = invocation.getArgument(0);
            created.setId("new-protocol");
            created.prePersist();
            return created;
        });

        var output = useCase.execute(new ProtocolInputDto(
                "Física",
                "Rampa bloqueada - comércio usando calçada",
                address,
                "Goiânia",
                "GO",
                -16.6869,
                -49.2648,
                List.of()
        ), "citizen-from-sp", "Ana");

        assertEquals("est-goiania", output.establishmentId());
        assertEquals("campaign-go", output.campaignId());
    }

    @Test
    void doesNotSaveProtocolWithoutActiveCampaignInReportedRegion() {
        ProtocolRepository repository = mock(ProtocolRepository.class);
        ServerStatePermissionService permissions = mock(ServerStatePermissionService.class);
        RegionalCampaignRoutingService campaignRouting = mock(RegionalCampaignRoutingService.class);
        CreateProtocolUseCase useCase = new CreateProtocolUseCase(repository, permissions, campaignRouting);
        String address = "Rua das Flores, 10 - Centro, Palmas - TO";
        when(permissions.resolveState("TO", address)).thenReturn("TO");
        when(campaignRouting.resolveActiveCampaign("Palmas", address, "TO"))
                .thenThrow(new IllegalArgumentException(
                        "Ainda não existe campanha ativa para a região informada. Nenhum protocolo foi salvo."
                ));

        assertThrows(IllegalArgumentException.class, () -> useCase.execute(new ProtocolInputDto(
                "Visual",
                "Piso tátil quebrado",
                address,
                "Palmas",
                "TO",
                -10.1844,
                -48.3336,
                List.of()
        ), "citizen-id", "Bruno"));
        verify(repository, never()).add(any(Protocol.class));
    }

    private RegionalCampaign campaign(String id, String establishmentId) {
        RegionalCampaign campaign = new RegionalCampaign();
        campaign.setId(id);
        campaign.setEstablishmentId(establishmentId);
        campaign.setName("Campanha teste");
        campaign.setScopeType("city");
        campaign.setCity("Teste");
        campaign.setState("SP");
        campaign.setStatus("active");
        return campaign;
    }
}
