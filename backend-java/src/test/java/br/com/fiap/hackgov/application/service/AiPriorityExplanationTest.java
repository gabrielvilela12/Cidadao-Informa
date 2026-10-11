package br.com.fiap.hackgov.application.service;

import br.com.fiap.hackgov.domain.ai.AiJobLog;
import br.com.fiap.hackgov.domain.entity.Protocol;
import br.com.fiap.hackgov.domain.repository.ProtocolRepository;
import br.com.fiap.hackgov.infrastructure.repository.AiJobLogRepository;
import br.com.fiap.hackgov.infrastructure.repository.AiPriorityJobRepository;
import org.junit.jupiter.api.Test;
import org.springframework.web.client.RestClient;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class AiPriorityExplanationTest {
    @Test
    void recordsServiceFailureForRetryWithoutLeavingProtocolPending() {
        var protocols = mock(ProtocolRepository.class);
        var jobs = mock(AiPriorityJobRepository.class);
        var client = mock(RestClient.class);
        when(client.post()).thenThrow(new IllegalStateException("network unavailable"));
        var service = new AiPriorityService(jobs, mock(AiJobLogRepository.class), protocols,
                mock(ProtocolAuditService.class), client, "", "");
        var protocol = new Protocol();
        protocol.setAiStatus("pending");
        when(protocols.getById("p")).thenReturn(Optional.of(protocol));
        service.createPriorityJob("p", "Buraco", "Física");
        assertEquals("failed", protocol.getAiStatus());
        verify(protocols).update(protocol);
        verify(jobs, times(2)).save(any());
    }

    @Test
    void returnsLatestMatchingReasonAndDoesNotAttachStalePriorityExplanation() {
        var protocols = mock(ProtocolRepository.class);
        var logs = mock(AiJobLogRepository.class);
        var service = new AiPriorityService(mock(AiPriorityJobRepository.class), logs, protocols,
                mock(ProtocolAuditService.class), mock(RestClient.class), "", "");
        var protocol = new Protocol();
        protocol.setAiPriority("alta");
        protocol.setAiStatus("success");
        when(protocols.getById("p")).thenReturn(Optional.of(protocol));
        var log = new AiJobLog("p", "alta", "ia");
        log.setReason("Risco de queda.");
        when(logs.findFirstByProtocolIdOrderByCreatedAtDescIdDesc("p")).thenReturn(Optional.of(log));
        assertEquals("Risco de queda.", service.getPriority("p").reason());
        assertEquals("ia", service.getPriority("p").source());
        protocol.setAiPriority("media");
        assertNull(service.getPriority("p").reason());
        when(logs.findFirstByProtocolIdOrderByCreatedAtDescIdDesc("p")).thenReturn(Optional.empty());
        assertNull(service.getPriority("p").reason());
    }
}
