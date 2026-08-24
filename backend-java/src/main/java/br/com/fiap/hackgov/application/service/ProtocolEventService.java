package br.com.fiap.hackgov.application.service;

import br.com.fiap.hackgov.application.dto.protocol.ProtocolSummaryOutputDto;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.io.IOException;
import java.time.Instant;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;
import java.util.function.Supplier;

/**
 * Canal de eventos dos protocolos consumido pelo mapa administrativo.
 *
 * Os emitters ficam apenas na memoria desta instancia. O deploy atual mantem
 * uma unica maquina Java no Fly.io; caso a API passe a usar varias replicas, o
 * broadcast deve ser transportado por Redis ou Postgres LISTEN/NOTIFY.
 */
@Service
public class ProtocolEventService {

    private static final Logger LOGGER = LoggerFactory.getLogger(ProtocolEventService.class);
    private static final long EMITTER_TIMEOUT_MS = 30 * 60 * 1000L;
    private static final long RECONNECT_AFTER_MS = 2_000L;

    private final Set<SseEmitter> emitters = ConcurrentHashMap.newKeySet();

    public SseEmitter subscribe() {
        SseEmitter emitter = new SseEmitter(EMITTER_TIMEOUT_MS);
        emitters.add(emitter);

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
        broadcast(() -> SseEmitter.event()
                .id(protocol.id())
                .name("protocol-created")
                .data(protocol));
    }

    /** Mantem proxies e balanceadores sem encerrar uma conexao ociosa. */
    @Scheduled(fixedDelayString = "${app.protocol-events.heartbeat-ms:25000}")
    public void heartbeat() {
        broadcast(() -> SseEmitter.event().comment("keep-alive"));
    }

    private void broadcast(Supplier<SseEmitter.SseEventBuilder> event) {
        emitters.forEach(emitter -> {
            try {
                emitter.send(event.get());
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
