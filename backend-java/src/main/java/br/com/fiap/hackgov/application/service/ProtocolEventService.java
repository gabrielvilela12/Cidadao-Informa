package br.com.fiap.hackgov.application.service;

import br.com.fiap.hackgov.application.dto.protocol.ProtocolSummaryOutputDto;
import br.com.fiap.hackgov.infrastructure.persistence.repository.JpaProtocolRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.PageRequest;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.io.IOException;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;
import java.util.function.LongFunction;
import java.util.function.Supplier;

/**
 * Canal de eventos dos protocolos consumido pelo mapa administrativo.
 *
 * Os emitters continuam locais porque uma conexao SSE fica presa a uma
 * instancia. A fonte dos eventos, porem, e o PostgreSQL: cada instancia que
 * possui assinantes consulta apenas os protocolos dos ultimos segundos. Assim
 * um POST atendido por outra instancia da Vercel tambem chega ao mapa.
 */
@Service
public class ProtocolEventService {

    private static final Logger LOGGER = LoggerFactory.getLogger(ProtocolEventService.class);
    private static final long EMITTER_TIMEOUT_MS = 30 * 60 * 1000L;
    private static final long RECONNECT_AFTER_MS = 2_000L;
    private static final long EVENT_LOOKBACK_SECONDS = 30L;
    private static final long INITIAL_REPLAY_SECONDS = 3L;
    private static final long DELIVERED_ID_RETENTION_MINUTES = 5L;
    private static final int MAX_EVENTS_PER_POLL = 1_000;

    private final Map<SseEmitter, Set<String>> emitters = new ConcurrentHashMap<>();
    private final Map<String, Instant> deliveredEventIds = new ConcurrentHashMap<>();
    private final JpaProtocolRepository protocolRepository;
    private final LongFunction<SseEmitter> emitterFactory;
    private volatile Instant trackingStartedAt = Instant.EPOCH;

    @Autowired
    public ProtocolEventService(JpaProtocolRepository protocolRepository) {
        this(protocolRepository, SseEmitter::new);
    }

    ProtocolEventService(
            JpaProtocolRepository protocolRepository,
            LongFunction<SseEmitter> emitterFactory
    ) {
        this.protocolRepository = protocolRepository;
        this.emitterFactory = emitterFactory;
    }

    public SseEmitter subscribe(Set<String> allowedStates) {
        if (emitters.isEmpty()) {
            trackingStartedAt = Instant.now();
            deliveredEventIds.clear();
        }

        SseEmitter emitter = emitterFactory.apply(EMITTER_TIMEOUT_MS);
        emitters.put(emitter, Set.copyOf(allowedStates));

        Runnable remove = () -> emitters.remove(emitter);
        emitter.onCompletion(remove);
        emitter.onTimeout(remove);
        emitter.onError(error -> remove.run());

        try {
            emitter.send(SseEmitter.event()
                    .name("connected")
                    .reconnectTime(RECONNECT_AFTER_MS)
                    .data(new ConnectedEvent(Instant.now())));
        } catch (IOException exception) {
            remove.run();
            emitter.completeWithError(exception);
        }

        return emitter;
    }

    public void publishCreated(ProtocolSummaryOutputDto protocol) {
        // Entrega imediata quando o POST caiu na mesma instancia do assinante.
        // A consulta agendada cobre as demais instancias.
        if (!emitters.isEmpty()) {
            deliverOnce(protocol);
        }
    }

    /**
     * Sincroniza eventos criados por qualquer instancia da aplicacao.
     *
     * A janela sobreposta evita perder um registro cujo created_at foi definido
     * antes de o commit ficar visivel. O mapa de ids elimina repeticoes.
     */
    @Scheduled(fixedDelayString = "${app.protocol-events.poll-ms:1000}")
    public void pollCreatedProtocols() {
        if (emitters.isEmpty()) {
            return;
        }

        Instant now = Instant.now();
        Instant lookbackStart = now.minus(EVENT_LOOKBACK_SECONDS, ChronoUnit.SECONDS);
        Instant subscriptionStart = trackingStartedAt.minus(INITIAL_REPLAY_SECONDS, ChronoUnit.SECONDS);
        Instant createdAfter = subscriptionStart.isAfter(lookbackStart)
                ? subscriptionStart
                : lookbackStart;

        try {
            protocolRepository.findAllProjectedByCreatedAtAfterOrderByCreatedAtAsc(
                            createdAfter,
                            PageRequest.of(0, MAX_EVENTS_PER_POLL)
                    )
                    .stream()
                    .map(this::toSummary)
                    .forEach(this::deliverOnce);
            pruneDeliveredIds(now);
        } catch (Exception exception) {
            LOGGER.error("Failed to poll protocol events from the database", exception);
        }
    }

    /** Mantem proxies e balanceadores sem encerrar uma conexao ociosa. */
    @Scheduled(fixedDelayString = "${app.protocol-events.heartbeat-ms:25000}")
    public void heartbeat() {
        broadcast(() -> SseEmitter.event().comment("keep-alive"));
    }

    private void deliverOnce(ProtocolSummaryOutputDto protocol) {
        if (deliveredEventIds.putIfAbsent(protocol.id(), Instant.now()) != null) {
            return;
        }

        broadcastProtocol(protocol);
    }

    private void pruneDeliveredIds(Instant now) {
        Instant cutoff = now.minus(DELIVERED_ID_RETENTION_MINUTES, ChronoUnit.MINUTES);
        deliveredEventIds.entrySet().removeIf(entry -> entry.getValue().isBefore(cutoff));
    }

    private ProtocolSummaryOutputDto toSummary(
            JpaProtocolRepository.ProtocolEventProjection protocol
    ) {
        return new ProtocolSummaryOutputDto(
                protocol.getId(),
                protocol.getCategory(),
                protocol.getDescription(),
                protocol.getAddress(),
                protocol.getStateCode(),
                protocol.getCreatedAt(),
                protocol.getStatus(),
                protocol.getResolutionCost(),
                protocol.getUserId(),
                protocol.getEstablishmentId(),
                protocol.getCampaignId(),
                protocol.getRequester(),
                protocol.getUser() == null ? null : protocol.getUser().getPhone(),
                protocol.getAiPriority(),
                protocol.getAiStatus(),
                protocol.getLatitude(),
                protocol.getLongitude(),
                protocol.getCorrectionStatus(),
                protocol.getCorrectionError(),
                protocol.getCorrectionGeneratedAt(),
                1,
                false,
                false,
                protocol.getId()
        );
    }

    private void broadcast(Supplier<SseEmitter.SseEventBuilder> event) {
        emitters.keySet().forEach(emitter -> {
            try {
                emitter.send(event.get());
            } catch (Exception exception) {
                emitters.remove(emitter);
                emitter.complete();
                LOGGER.debug("Removed disconnected protocol event subscriber: {}", exception.getMessage());
            }
        });
    }

    private void broadcastProtocol(ProtocolSummaryOutputDto protocol) {
        emitters.forEach((emitter, states) -> {
            if (protocol.stateCode() == null || !states.contains(protocol.stateCode())) return;
            try {
                emitter.send(SseEmitter.event()
                        .id(protocol.id())
                        .name("protocol-created")
                        .data(protocol));
            } catch (Exception exception) {
                emitters.remove(emitter);
                emitter.complete();
                LOGGER.debug("Removed disconnected protocol event subscriber: {}", exception.getMessage());
            }
        });
    }

    private record ConnectedEvent(Instant connectedAt) {
    }
}
