package br.com.fiap.hackgov.application.service;

import br.com.fiap.hackgov.domain.ai.AiJobLog;
import br.com.fiap.hackgov.domain.ai.AiPriorityJob;
import br.com.fiap.hackgov.domain.entity.Protocol;
import br.com.fiap.hackgov.domain.repository.ProtocolRepository;
import br.com.fiap.hackgov.infrastructure.repository.AiJobLogRepository;
import br.com.fiap.hackgov.infrastructure.repository.AiPriorityJobRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@Service
public class AiPriorityService {

    private static final Logger LOGGER = LoggerFactory.getLogger(AiPriorityService.class);

    private final AiPriorityJobRepository jobRepository;
    private final AiJobLogRepository logRepository;
    private final ProtocolRepository protocolRepository;
    private final ProtocolAuditService auditService;
    private final RestClient restClient;
    private final String edgeFunctionUrl;
    private final String supabaseAnonKey;

    public AiPriorityService(
            AiPriorityJobRepository jobRepository,
            AiJobLogRepository logRepository,
            ProtocolRepository protocolRepository,
            ProtocolAuditService auditService,
            RestClient restClient,
            @Value("${app.supabase.edge-function-url}") String edgeFunctionUrl,
            @Value("${app.supabase.anon-key}") String supabaseAnonKey
    ) {
        this.jobRepository = jobRepository;
        this.logRepository = logRepository;
        this.protocolRepository = protocolRepository;
        this.auditService = auditService;
        this.restClient = restClient;
        this.edgeFunctionUrl = edgeFunctionUrl;
        this.supabaseAnonKey = supabaseAnonKey;
    }

    public void createPriorityJob(String protocolId, String description, String category) {
        AiPriorityJob job = new AiPriorityJob(protocolId, description, category);
        jobRepository.save(job);
        triggerClassification(job);
        LOGGER.info("Created AI priority job for protocol {}", protocolId);
    }

    private void triggerClassification(AiPriorityJob job) {
        try {
            var request = new ClassificationRequest(
                    job.getProtocolId(),
                    job.getDescription(),
                    job.getCategory()
            );

            restClient.post()
                    .uri(edgeFunctionUrl)
                    .header("apikey", supabaseAnonKey)
                    .header(HttpHeaders.AUTHORIZATION, "Bearer " + supabaseAnonKey)
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(request)
                    .retrieve()
                    .toBodilessEntity();

            LOGGER.debug("Triggered classification for job {}", job.getId());
        } catch (Exception exception) {
            LOGGER.error(
                    "Failed to trigger Edge Function for job {}: {}",
                    job.getId(),
                    exception.getMessage()
            );
        }
    }

    public void updatePriorityManual(
            String protocolId,
            String newPriority,
            String adminId,
            String reason
    ) {
        if (!List.of("baixa", "media", "alta", "critica").contains(newPriority)) {
            throw new IllegalArgumentException("Prioridade inválida.");
        }

        Protocol protocol = getProtocol(protocolId);
        String previousPriority = protocol.getAiPriority();

        protocol.setAiPriority(newPriority);
        protocol.setAiStatus("success");
        protocolRepository.update(protocol);

        AiJobLog jobLog = new AiJobLog(protocolId, newPriority, "admin_manual");
        jobLog.setPreviousPriority(previousPriority);
        jobLog.setReason(reason == null || reason.isBlank() ? null : reason.trim());
        logRepository.save(jobLog);

        auditService.append(
                protocolId,
                "PRIORITY_CHANGED",
                adminId,
                "admin",
                protocol.getStatus(),
                protocol.getStatus(),
                Map.of(
                        "previous_priority", previousPriority == null ? "" : previousPriority,
                        "new_priority", newPriority,
                        "reason_hash",
                        reason == null || reason.isBlank()
                                ? ""
                                : auditService.hashValue(reason.trim())
                )
        );
    }

    public void regeneratePriority(String protocolId) {
        AiPriorityJob job = jobRepository.findByProtocolId(protocolId)
                .orElseThrow(() -> new IllegalArgumentException("Job não encontrado para o protocolo."));

        job.setStatus("pending");
        job.setAttemptCount(job.getAttemptCount() + 1);
        job.setResultPriority(null);
        job.setErrorMessage(null);
        job.setProcessingStartedAt(null);
        job.setCompletedAt(null);
        jobRepository.save(job);

        Protocol protocol = getProtocol(protocolId);
        protocol.setAiStatus("pending");
        protocolRepository.update(protocol);
        triggerClassification(job);
    }

    public PriorityStatus getPriority(String protocolId) {
        Protocol protocol = getProtocol(protocolId);
        return new PriorityStatus(
                protocol.getAiPriority(),
                protocol.getAiStatus() == null ? "pending" : protocol.getAiStatus()
        );
    }

    public List<AiJobLog> getAuditLogs(int days) {
        int safeDays = Math.max(1, Math.min(days, 90));
        return logRepository.findRecent(LocalDateTime.now().minusDays(safeDays));
    }

    public List<AiPriorityJob> getFailedJobs() {
        return jobRepository.findFailedJobsForRetry(LocalDateTime.now().minusHours(24));
    }

    private Protocol getProtocol(String protocolId) {
        return protocolRepository.getById(protocolId)
                .orElseThrow(() -> new IllegalArgumentException("Protocolo não encontrado."));
    }

    record ClassificationRequest(String protocol_id, String description, String category) {
    }

    public record PriorityStatus(String priority, String aiStatus) {
    }
}
