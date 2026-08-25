package br.com.fiap.hackgov.api.controller;

import br.com.fiap.hackgov.application.dto.protocol.ProtocolOutputDto;
import br.com.fiap.hackgov.application.dto.protocol.ProtocolStatusUpdateInputDto;
import br.com.fiap.hackgov.application.service.AiImageCorrectionService;
import br.com.fiap.hackgov.application.service.AiPriorityService;
import br.com.fiap.hackgov.application.service.GeocodingService;
import br.com.fiap.hackgov.application.service.ProtocolAuditService;
import br.com.fiap.hackgov.application.service.ProtocolEventService;
import br.com.fiap.hackgov.application.service.ProtocolLocationGroupService;
import br.com.fiap.hackgov.application.service.ServerStatePermissionService;
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
import java.util.Set;
import java.util.List;
import java.util.stream.IntStream;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertInstanceOf;
import static org.junit.jupiter.api.Assertions.assertTrue;
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
        ServerStatePermissionService permissions = mock(ServerStatePermissionService.class);
        ProtocolsController controller = new ProtocolsController(
                mock(CreateProtocolUseCase.class),
                mock(GetProtocolsUseCase.class),
                mock(GetPublicStatsUseCase.class),
                repository,
                auditService,
                mock(AiPriorityService.class),
                mock(AiImageCorrectionService.class),
                mock(GeocodingService.class),
                mock(ProtocolEventService.class),
                new ProtocolLocationGroupService(repository),
                permissions
        );

        Protocol original = protocol(protocolId, "Aberto", null);
        when(permissions.allowedStates("admin-id")).thenReturn(Set.of("SP"));
        when(permissions.canAccess(original, Set.of("SP"))).thenReturn(true);
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

    @Test
    void propagatesStatusFromSecondProtocolWithSameCauseAndLocation() {
        ProtocolRepository repository = mock(ProtocolRepository.class);
        ProtocolAuditService auditService = mock(ProtocolAuditService.class);
        ServerStatePermissionService permissions = mock(ServerStatePermissionService.class);
        ProtocolLocationGroupService groups = new ProtocolLocationGroupService(repository);
        ProtocolsController controller = new ProtocolsController(
                mock(CreateProtocolUseCase.class), mock(GetProtocolsUseCase.class),
                mock(GetPublicStatsUseCase.class), repository, auditService,
                mock(AiPriorityService.class), mock(AiImageCorrectionService.class),
                mock(GeocodingService.class), mock(ProtocolEventService.class), groups, permissions
        );
        List<Protocol> members = IntStream.range(0, 2).mapToObj(index -> {
            Protocol item = protocol("protocol-" + index, "Aberto", null);
            item.setLocationKey("ribeirao preto sp");
            item.setCauseKey("fisica|semaforo apagado");
            item.setCreatedAt(Instant.parse("2026-08-24T12:59:28Z").plusSeconds(index));
            return item;
        }).toList();
        Protocol target = members.get(1);

        when(repository.getById(target.getId())).thenReturn(Optional.of(target));
        when(repository.getByLocationAndCause("ribeirao preto sp", "fisica|semaforo apagado")).thenReturn(members);
        when(permissions.allowedStates("admin-id")).thenReturn(Set.of("SP"));
        when(permissions.canAccess(org.mockito.ArgumentMatchers.any(Protocol.class), org.mockito.ArgumentMatchers.eq(Set.of("SP"))))
                .thenReturn(true);
        Authentication authentication = mock(Authentication.class);
        when(authentication.getPrincipal()).thenReturn(
                new AuthenticatedUser("admin-id", "Administrador", "00000000000", "admin")
        );

        ResponseEntity<?> response = controller.updateStatus(
                target.getId(),
                new ProtocolStatusUpdateInputDto("Em Análise", "Triagem iniciada", null),
                authentication
        );

        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertTrue(members.stream().allMatch(item -> "Em Análise".equals(item.getStatus())));
        ProtocolOutputDto output = assertInstanceOf(ProtocolOutputDto.class, response.getBody());
        assertTrue(output.locationGrouped());
        assertEquals(2, output.locationReports().size());
        verify(repository, times(2)).update(org.mockito.ArgumentMatchers.any(Protocol.class));
    }

    private Protocol protocol(String id, String status, BigDecimal resolutionCost) {
        Protocol protocol = new Protocol();
        protocol.setId(id);
        protocol.setCategory("Física");
        protocol.setDescription("Semáforo apagado");
        protocol.setAddress("Ribeirão Preto - SP");
        protocol.setStateCode("SP");
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
