package br.com.fiap.hackgov.application.service;

import br.com.fiap.hackgov.domain.ai.AiChatRequestEvent;
import br.com.fiap.hackgov.infrastructure.persistence.repository.JpaAiChatRequestEventRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.temporal.ChronoUnit;

@Service
public class AiChatRequestLimitService {

    private final JpaAiChatRequestEventRepository repository;
    private final int requestsPerHour;

    public AiChatRequestLimitService(
            JpaAiChatRequestEventRepository repository,
            @Value("${app.ai.limits.requests-per-hour:10}") int requestsPerHour
    ) {
        if (requestsPerHour <= 0) {
            throw new IllegalArgumentException("Limite de perguntas por hora inválido.");
        }
        this.repository = repository;
        this.requestsPerHour = requestsPerHour;
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void checkAndRecord(String establishmentId, String userId) {
        if (establishmentId == null || establishmentId.isBlank()
                || userId == null || userId.isBlank()) {
            throw new IllegalArgumentException("Usuário sem vínculo para controle de perguntas.");
        }

        repository.lockByUserId(userId);
        Instant windowStart = Instant.now().minus(1, ChronoUnit.HOURS);
        if (repository.countByUserIdAndCreatedAtGreaterThanEqual(userId, windowStart) >= requestsPerHour) {
            throw new AiUsageLimitExceededException(
                    "Você atingiu o limite de " + requestsPerHour
                            + " perguntas em 60 minutos. Aguarde antes de enviar uma nova pergunta."
            );
        }

        AiChatRequestEvent event = new AiChatRequestEvent();
        event.setEstablishmentId(establishmentId);
        event.setUserId(userId);
        repository.save(event);
    }
}
