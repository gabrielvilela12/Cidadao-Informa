package br.com.fiap.hackgov.infrastructure.task;

import br.com.fiap.hackgov.application.service.AiPriorityService;
import br.com.fiap.hackgov.domain.ai.AiPriorityJob;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
@ConditionalOnProperty(
        name = "app.scheduling.enabled",
        havingValue = "true",
        matchIfMissing = true
)
public class RetryFailedAiJobsTask {

    private static final Logger LOGGER = LoggerFactory.getLogger(RetryFailedAiJobsTask.class);

    private final AiPriorityService aiPriorityService;

    public RetryFailedAiJobsTask(AiPriorityService aiPriorityService) {
        this.aiPriorityService = aiPriorityService;
    }

    @Scheduled(fixedDelay = 300000)
    public void retryFailedJobs() {
        try {
            List<AiPriorityJob> failedJobs = aiPriorityService.getFailedJobs();
            failedJobs.forEach(job -> {
                try {
                    aiPriorityService.regeneratePriority(job.getProtocolId());
                } catch (Exception exception) {
                    LOGGER.error("Failed to retry job {}: {}", job.getId(), exception.getMessage());
                }
            });
        } catch (Exception exception) {
            LOGGER.error("Error in retry task", exception);
        }
    }
}
