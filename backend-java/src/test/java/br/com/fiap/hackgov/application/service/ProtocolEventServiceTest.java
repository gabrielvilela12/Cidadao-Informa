package br.com.fiap.hackgov.application.service;

import br.com.fiap.hackgov.infrastructure.persistence.repository.JpaProtocolRepository;
import br.com.fiap.hackgov.infrastructure.persistence.repository.JpaProtocolRepository.ProtocolEventProjection;
import org.junit.jupiter.api.Test;
import org.springframework.data.domain.Pageable;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.time.Instant;
import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.reset;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class ProtocolEventServiceTest {

    @Test
    void doesNotPollDatabaseWithoutSubscribers() {
        JpaProtocolRepository repository = mock(JpaProtocolRepository.class);
        ProtocolEventService service = new ProtocolEventService(repository);

        service.pollCreatedProtocols();

        verify(repository, never()).findAllProjectedByCreatedAtAfterOrderByCreatedAtAsc(any(), any());
    }

    @Test
    void broadcastsDatabaseEventOnlyOnceAcrossOverlappingPollWindows() throws Exception {
        JpaProtocolRepository repository = mock(JpaProtocolRepository.class);
        SseEmitter emitter = mock(SseEmitter.class);
        ProtocolEventService service = new ProtocolEventService(repository, ignored -> emitter);
        ProtocolEventProjection protocol = protocol("protocol-123");

        service.subscribe();
        reset(emitter);
        when(repository.findAllProjectedByCreatedAtAfterOrderByCreatedAtAsc(any(Instant.class), any(Pageable.class)))
                .thenReturn(List.of(protocol));

        service.pollCreatedProtocols();
        service.pollCreatedProtocols();

        verify(emitter, times(1)).send(any(SseEmitter.SseEventBuilder.class));
    }

    private ProtocolEventProjection protocol(String id) {
        ProtocolEventProjection projection = mock(ProtocolEventProjection.class);
        when(projection.getId()).thenReturn(id);
        when(projection.getCategory()).thenReturn("Física");
        when(projection.getDescription()).thenReturn("Nova rampa de acesso");
        when(projection.getAddress()).thenReturn("Praça Central");
        when(projection.getCreatedAt()).thenReturn(Instant.now());
        when(projection.getStatus()).thenReturn("Aberto");
        when(projection.getUserId()).thenReturn("user-1");
        when(projection.getRequester()).thenReturn("Cidadão");
        when(projection.getAiStatus()).thenReturn("pending");
        when(projection.getLatitude()).thenReturn(-23.55);
        when(projection.getLongitude()).thenReturn(-46.63);
        when(projection.getCorrectionStatus()).thenReturn("idle");
        return projection;
    }
}
