package br.com.fiap.hackgov.infrastructure.task;

import br.com.fiap.hackgov.domain.ai.AiPriorityJob;
import br.com.fiap.hackgov.application.service.AiPriorityService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.util.List;

@Slf4j
@Component
@RequiredArgsConstructor
public class RetryFailedAiJobsTask {
    private final AiPriorityService aiPriorityService;

    @Scheduled(fixedDelay = 300000)
    public void retryFailedJobs() {
        try {
            log.debug("Starting retry task for failed AI jobs");

            List<AiPriorityJob> failedJobs = aiPriorityService.getFailedJobs();

            if (failedJobs.isEmpty()) {
                log.debug("No failed jobs to retry");
                return;
            }

            log.info("Found {} failed jobs to retry", failedJobs.size());

            failedJobs.forEach(job -> {
                try {
                    log.info("Retrying job {} for protocol {}", job.getId(), job.getProtocolId());
                    aiPriorityService.regeneratePriority(job.getProtocolId().toString());
                } catch (Exception e) {
                    log.error("Failed to retry job {}: {}", job.getId(), e.getMessage());
                }
            });

        } catch (Exception e) {
            log.error("Error in retry task: {}", e.getMessage(), e);
        }
    }
}
