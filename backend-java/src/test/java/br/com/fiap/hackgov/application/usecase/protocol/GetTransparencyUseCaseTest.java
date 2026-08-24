package br.com.fiap.hackgov.application.usecase.protocol;

import br.com.fiap.hackgov.application.dto.protocol.TransparencyOutputDto;
import br.com.fiap.hackgov.application.service.ProtocolAuditService;
import br.com.fiap.hackgov.domain.repository.ProtocolRepository;
import br.com.fiap.hackgov.domain.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.Instant;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class GetTransparencyUseCaseTest {

    @Mock
    private ProtocolRepository protocolRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private ProtocolAuditService auditService;

    @InjectMocks
    private GetTransparencyUseCase useCase;

    @Test
    void returnsAggregatedAnonymizedPublicData() {
        Instant recent = Instant.now().minusSeconds(3600);
        when(protocolRepository.getTransparencyData()).thenReturn(List.of(
                protocol(
                        "095b2bf0-secret-tail",
                        "Física",
                        "Rua Cônego Barros, 120 - Vila, Ribeirão Preto - SP",
                        recent,
                        "Aberto",
                        "alta",
                        "success",
                        -21.1775,
                        -47.8103
                ),
                protocol(
                        "completed-2",
                        "Visual",
                        "Avenida Paulista, 1000 - Bela Vista, São Paulo/SP",
                        recent.minusSeconds(86400),
                        "Concluído",
                        "media",
                        "success",
                        null,
                        null
                )
        ));
        when(userRepository.countByRole("citizen")).thenReturn(9L);
        when(auditService.verifyAll()).thenReturn(
                new ProtocolAuditService.AuditVerificationDto(true, 12, null, null, "private-hash")
        );

        TransparencyOutputDto result = useCase.execute();

        assertEquals(2, result.overview().total());
        assertEquals(1, result.overview().completed());
        assertEquals(50, result.overview().resolutionRate());
        assertEquals(9, result.overview().citizens());
        assertEquals(1, result.geography().size());
        assertEquals(-21.25, result.geography().getFirst().latitude());
        assertEquals(-47.75, result.geography().getFirst().longitude());
        assertEquals("095b2bf0", result.recentProtocols().getFirst().publicId());
        assertEquals("Ribeirão Preto - SP", result.recentProtocols().getFirst().location());
        assertFalse(result.recentProtocols().getFirst().location().contains("Cônego"));
        assertTrue(result.audit().valid());
        assertEquals(12, result.audit().totalBlocks());
    }

    private ProtocolRepository.TransparencyProtocol protocol(
            String id,
            String category,
            String address,
            Instant createdAt,
            String status,
            String priority,
            String aiStatus,
            Double latitude,
            Double longitude
    ) {
        return new ProtocolRepository.TransparencyProtocol(
                id,
                category,
                address,
                createdAt,
                status,
                priority,
                aiStatus,
                latitude,
                longitude
        );
    }
}
