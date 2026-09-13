package br.com.fiap.hackgov.application.service;

import br.com.fiap.hackgov.domain.ai.AiJobLog;
import br.com.fiap.hackgov.domain.ai.AiPriorityJob;
import br.com.fiap.hackgov.domain.entity.Protocol;
import br.com.fiap.hackgov.domain.repository.ProtocolRepository;
import br.com.fiap.hackgov.infrastructure.repository.AiJobLogRepository;
import br.com.fiap.hackgov.infrastructure.repository.AiPriorityJobRepository;
import org.junit.jupiter.api.Test;
import org.springframework.web.client.RestClient;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Set;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class AiPriorityRegionalScopeTest {
    @Test
    void showsOnlyOwnMunicipalityLogsAndFailedJobs() {
        AiPriorityJobRepository jobs = mock(AiPriorityJobRepository.class);
        AiJobLogRepository logs = mock(AiJobLogRepository.class);
        ProtocolRepository protocols = mock(ProtocolRepository.class);
        AiPriorityService service = new AiPriorityService(
                jobs, logs, protocols, mock(ProtocolAuditService.class), mock(RestClient.class), "", "");
        Protocol ribeirao = new Protocol();
        ribeirao.setId("rp-1");
        when(protocols.getByEstablishmentId("est-rp")).thenReturn(List.of(ribeirao));
        when(logs.findRecent(any(LocalDateTime.class))).thenReturn(List.of(
                new AiJobLog("rp-1", "alta", "ai"),
                new AiJobLog("sp-1", "media", "ai")
        ));
        when(jobs.findFailedJobsForRetry(any(LocalDateTime.class))).thenReturn(List.of(
                new AiPriorityJob("rp-1", "Falha", "Física"),
                new AiPriorityJob("sp-1", "Falha", "Visual")
        ));

        assertEquals("rp-1", service.getAuditLogs(7, Set.of("SP"), "est-rp").getFirst().getProtocolId());
        assertEquals(1, service.getAuditLogs(7, Set.of("SP"), "est-rp").size());
        assertEquals("rp-1", service.getFailedJobs(Set.of("SP"), "est-rp").getFirst().getProtocolId());
        assertEquals(1, service.getFailedJobs(Set.of("SP"), "est-rp").size());
    }
}
