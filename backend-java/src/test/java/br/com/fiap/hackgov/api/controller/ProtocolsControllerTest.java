package br.com.fiap.hackgov.api.controller;

import br.com.fiap.hackgov.application.dto.protocol.ProtocolOutputDto;
import br.com.fiap.hackgov.application.dto.protocol.ProtocolStatusUpdateInputDto;
import br.com.fiap.hackgov.application.service.AiImageCorrectionService;
import br.com.fiap.hackgov.application.service.AiPriorityService;
import br.com.fiap.hackgov.application.service.GeocodingService;
import br.com.fiap.hackgov.application.service.ProtocolAuditService;
import br.com.fiap.hackgov.application.service.ProtocolEventService;
import br.com.fiap.hackgov.application.usecase.protocol.CreateProtocolUseCase;
import br.com.fiap.hackgov.application.usecase.protocol.GetProtocolsUseCase;
import br.com.fiap.hackgov.application.usecase.protocol.GetPublicStatsUseCase;
import br.com.fiap.hackgov.domain.entity.Protocol;
import br.com.fiap.hackgov.domain.entity.User;
import br.com.fiap.hackgov.domain.repository.ProtocolRepository;
import br.com.fiap.hackgov.infrastructure.security.AuthenticatedUser;
import org.hibernate.LazyInitializationException;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.ArrayList;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertInstanceOf;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class ProtocolsControllerTest {

    @Test
    void reloadsProtocolBeforeBuildingStatusUpdateResponse() {
        String protocolId = "a8b9c760-0a23-4046-afa2-6baba61ee556";
        BigDecimal cost = new BigDecimal("4500.00");
        ProtocolRepository repository = mock(ProtocolRepository.class);
        ProtocolAuditService auditService = mock(ProtocolAuditService.class);
        ProtocolsController controller = new ProtocolsController(
                mock(CreateProtocolUseCase.class),
                mock(GetProtocolsUseCase.class),
                mock(GetPublicStatsUseCase.class),
                repository,
                auditService,
                mock(AiPriorityService.class),
                mock(AiImageCorrectionService.class),
                mock(GeocodingService.class),
                mock(ProtocolEventService.class)
        );

        Protocol original = protocol(protocolId, "Aberto", null);
        Protocol detachedAfterSave = mock(Protocol.class);
        when(detachedAfterSave.getStatus()).thenReturn("Concluído");
        when(detachedAfterSave.getUser()).thenThrow(new LazyInitializationException("session closed"));
        Protocol reloaded = protocol(protocolId, "Concluído", cost);
        User citizen = new User();
        citizen.setPhone("11999999999");
        reloaded.setUser(citizen);

        when(repository.getById(protocolId))
                .thenReturn(Optional.of(original), Optional.of(reloaded));
        when(repository.update(original)).thenReturn(detachedAfterSave);

        Authentication authentication = mock(Authentication.class);
        when(authentication.getPrincipal()).thenReturn(
                new AuthenticatedUser("admin-id", "Administrador", "00000000000", "admin")
        );

        ResponseEntity<?> response = controller.updateStatus(
                protocolId,
                new ProtocolStatusUpdateInputDto("Concluído", "Serviço executado", cost),
                authentication
        );

        assertEquals(HttpStatus.OK, response.getStatusCode());
        ProtocolOutputDto output = assertInstanceOf(ProtocolOutputDto.class, response.getBody());
        assertEquals("Concluído", output.status());
        assertEquals(cost, output.resolutionCost());
        assertEquals("11999999999", output.phone());
        verify(repository, times(2)).getById(protocolId);
    }

    private Protocol protocol(String id, String status, BigDecimal resolutionCost) {
        Protocol protocol = new Protocol();
        protocol.setId(id);
        protocol.setCategory("Física");
        protocol.setDescription("Semáforo apagado");
        protocol.setAddress("Ribeirão Preto - SP");
        protocol.setCreatedAt(Instant.parse("2026-08-24T12:59:28Z"));
        protocol.setStatus(status);
        protocol.setResolutionCost(resolutionCost);
        protocol.setUserId("citizen-id");
        protocol.setRequester("Cidadão");
        protocol.setImageUrls(new ArrayList<>());
        protocol.setCorrectedImageUrls(new ArrayList<>());
        return protocol;
    }
}
