package br.com.fiap.hackgov.application.usecase.protocol;

import br.com.fiap.hackgov.application.dto.protocol.PublicStatsOutputDto;
import br.com.fiap.hackgov.domain.repository.ProtocolRepository;
import br.com.fiap.hackgov.domain.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.mockito.ArgumentMatchers.anyList;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class GetPublicStatsUseCaseTest {

    @Mock
    private ProtocolRepository protocolRepository;

    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private GetPublicStatsUseCase useCase;

    @Test
    void shouldReturnAggregatedPublicStats() {
        when(protocolRepository.countAll()).thenReturn(8L);
        when(protocolRepository.countByStatuses(List.of(
                "Concluido",
                "Concluído",
                "Resolved",
                "Closed"
        ))).thenReturn(5L);
        when(userRepository.countByRole("citizen")).thenReturn(12L);

        PublicStatsOutputDto result = useCase.execute();

        assertEquals(8L, result.total());
        assertEquals(5L, result.resolved());
        assertEquals(63, result.resolutionRate());
        assertEquals(12L, result.citizens());
    }

    @Test
    void shouldReturnNullResolutionRateWhenThereAreNoProtocols() {
        when(protocolRepository.countAll()).thenReturn(0L);
        when(protocolRepository.countByStatuses(List.of(
                "Concluido",
                "Concluído",
                "Resolved",
                "Closed"
        ))).thenReturn(0L);
        when(userRepository.countByRole("citizen")).thenReturn(3L);

        PublicStatsOutputDto result = useCase.execute();

        assertEquals(0L, result.total());
        assertEquals(0L, result.resolved());
        assertNull(result.resolutionRate());
        assertEquals(3L, result.citizens());
    }

    @Test
    void shouldCountOnlyResolvedStatusVariants() {
        when(protocolRepository.countAll()).thenReturn(1L);
        when(protocolRepository.countByStatuses(anyList())).thenReturn(1L);
        when(userRepository.countByRole("citizen")).thenReturn(1L);

        useCase.execute();

        @SuppressWarnings("unchecked")
        ArgumentCaptor<List<String>> captor = ArgumentCaptor.forClass(List.class);
        verify(protocolRepository).countByStatuses(captor.capture());
        assertEquals(List.of("Concluido", "Concluído", "Resolved", "Closed"), captor.getValue());
    }
}
