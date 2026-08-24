package br.com.fiap.hackgov.domain.repository;

import br.com.fiap.hackgov.domain.entity.Protocol;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

public interface ProtocolRepository {

    Protocol add(Protocol protocol);

    Optional<Protocol> getById(String id);

    List<Protocol> getAll();

    List<Protocol> getByUserId(String userId);

    long countAll();

    long countByStatuses(List<String> statuses);

    /**
     * Recorte leve e sem dados pessoais usado exclusivamente pelas estatísticas
     * públicas. Evita carregar imagens, descrições e o relacionamento do usuário.
     */
    List<TransparencyProtocol> getTransparencyData();

    /** Protocolos sem coordenada, do mais recente para o mais antigo. */
    List<Protocol> getWithoutCoordinates(int limit);

    /** Quantos protocolos ainda estao sem coordenada. */
    long countWithoutCoordinates();

    Protocol update(Protocol protocol);

    record TransparencyProtocol(
            String id,
            String category,
            String address,
            Instant createdAt,
            String status,
            String aiPriority,
            String aiStatus,
            Double latitude,
            Double longitude
    ) {
    }
}
