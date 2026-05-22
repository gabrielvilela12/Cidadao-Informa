package br.com.fiap.hackgov.application.service;

import br.com.fiap.hackgov.domain.ai.AiJobLog;
import br.com.fiap.hackgov.domain.ai.AiPriorityJob;
import br.com.fiap.hackgov.domain.entity.Protocol;
import br.com.fiap.hackgov.domain.repository.ProtocolRepository;
import br.com.fiap.hackgov.infrastructure.repository.AiJobLogRepository;
import br.com.fiap.hackgov.infrastructure.repository.AiPriorityJobRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class AiPriorityService {
    private final AiPriorityJobRepository jobRepository;
    private final AiJobLogRepository logRepository;
    private final ProtocolRepository protocolRepository;
    private final RestClient restClient;

    @Value("${app.supabase.edge-function-url}")
    private String edgeFunctionUrl;

    public void createPriorityJob(String protocolId, String description, String category) {
        AiPriorityJob job = new AiPriorityJob(protocolId, description, category);
        jobRepository.save(job);

        triggerClassification(job);

        log.info("Created AI priority job for protocol: {}", protocolId);
    }

    private void triggerClassification(AiPriorityJob job) {
        try {
            var request = new ClassificationRequest(
                job.getProtocolId().toString(),
                job.getDescription(),
                job.getCategory()
            );

            restClient.post()
                    .uri(edgeFunctionUrl)
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(request)
                    .retrieve()
                    .onStatus(status -> !status.is2xxSuccessful(), (httpRequest, httpResponse) -> {
                        log.error("Edge Function error: {}", httpResponse.getStatusCode());
                    })
                    .toBodilessEntity();

            log.debug("Triggered classification for job: {}", job.getId());
        } catch (Exception e) {
            log.error("Failed to trigger Edge Function for job {}: {}", job.getId(), e.getMessage());
        }
    }

    public void updatePriorityManual(String protocolId, String newPriority, UUID adminId, String reason) {
        Protocol protocol = protocolRepository.getById(protocolId)
                .orElseThrow(() -> new IllegalArgumentException("Protocol not found"));

        String previousPriority = protocol.getAiPriority();

        protocol.setAiPriority(newPriority);
        protocol.setAiStatus("success");
        protocolRepository.update(protocol);

        AiJobLog jobLog = new AiJobLog(protocolId, newPriority, "admin_manual");
        jobLog.setAdminId(adminId);
        jobLog.setPreviousPriority(previousPriority);
        jobLog.setReason(reason);
        logRepository.save(jobLog);

        log.info("Admin {} manually set priority to {} for protocol {}", adminId, newPriority, protocolId);
    }

    public void regeneratePriority(String protocolId) {
        AiPriorityJob job = jobRepository.findByProtocolId(UUID.fromString(protocolId))
                .orElseThrow(() -> new IllegalArgumentException("Job not found for protocol"));

        job.setStatus("pending");
        job.setAttemptCount(job.getAttemptCount() + 1);
        job.setResultPriority(null);
        job.setErrorMessage(null);
        job.setProcessingStartedAt(null);
        job.setCompletedAt(null);
        jobRepository.save(job);

        Protocol protocol = protocolRepository.getById(protocolId)
                .orElseThrow(() -> new IllegalArgumentException("Protocol not found"));
        protocol.setAiStatus("pending");
        protocolRepository.update(protocol);

        triggerClassification(job);

        log.info("Regenerating priority for protocol: {}", protocolId);
    }

    public List<AiJobLog> getAuditLogs(int days) {
        LocalDateTime cutoff = LocalDateTime.now().minusDays(days);
        return logRepository.findRecent(cutoff);
    }

    public List<AiPriorityJob> getFailedJobs() {
        LocalDateTime cutoff = LocalDateTime.now().minusHours(24);
        return jobRepository.findFailedJobsForRetry(cutoff);
    }

    record ClassificationRequest(String protocol_id, String description, String category) {
    }
}
