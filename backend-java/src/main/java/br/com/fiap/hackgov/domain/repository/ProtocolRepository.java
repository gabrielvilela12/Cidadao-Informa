package br.com.fiap.hackgov.domain.repository;

import br.com.fiap.hackgov.domain.entity.Protocol;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.Set;

public interface ProtocolRepository {

    Protocol add(Protocol protocol);

    Optional<Protocol> getById(String id);

    List<Protocol> getAll();

    List<Protocol> getByStates(Set<String> states);

    List<Protocol> getByUserId(String userId);

    List<Protocol> getByUserIdAndStates(String userId, Set<String> states);

    /** Mesma causa no mesmo local, em ordem cronologica para identificar o principal. */
    List<Protocol> getByLocationAndCause(String locationKey, String causeKey);

    long countAll();

    long countByStatuses(List<String> statuses);

    /** Contagens leves por cidadão para a listagem administrativa. */
    List<CitizenProtocolStats> getCitizenStats();

    List<CitizenProtocolStats> getCitizenStatsByStates(Set<String> states);

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
            BigDecimal resolutionCost,
            String aiPriority,
            String aiStatus,
            Double latitude,
            Double longitude
    ) {
    }

    record CitizenProtocolStats(
            String userId,
            long protocolCount,
            long openProtocolCount,
            Instant lastProtocolAt
    ) {
    }
}
