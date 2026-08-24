package br.com.fiap.hackgov.infrastructure.persistence.repository;

import br.com.fiap.hackgov.domain.entity.Protocol;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.Instant;
import java.util.Collection;
import java.util.List;
import java.util.Optional;

public interface JpaProtocolRepository extends JpaRepository<Protocol, String> {

    @EntityGraph(attributePaths = "user")
    List<Protocol> findAllByOrderByCreatedAtDesc();

    // Fila da geocodificacao: chamados que ainda nao tem posicao no mapa.
    List<Protocol> findByLatitudeIsNullOrderByCreatedAtDesc(Pageable pageable);

    long countByLatitudeIsNull();

    @EntityGraph(attributePaths = "user")
    List<Protocol> findByUserIdOrderByCreatedAtDesc(String userId);

    /**
     * Payload leve usado pelo barramento SSE entre instancias. A projecao evita
     * ler as imagens base64 dos protocolos a cada consulta de eventos.
     */
    List<ProtocolEventProjection> findAllProjectedByCreatedAtAfterOrderByCreatedAtAsc(
            Instant createdAfter,
            Pageable pageable
    );

    interface ProtocolEventProjection {
        String getId();
        String getCategory();
        String getDescription();
        String getAddress();
        Instant getCreatedAt();
        String getStatus();
        String getUserId();
        String getRequester();
        UserPhoneProjection getUser();
        String getAiPriority();
        String getAiStatus();
        Double getLatitude();
        Double getLongitude();
        String getCorrectionStatus();
        String getCorrectionError();
        Instant getCorrectionGeneratedAt();
    }

    interface UserPhoneProjection {
        String getPhone();
    }

    long countByStatusIn(Collection<String> statuses);

    @Override
    @EntityGraph(attributePaths = "user")
    Optional<Protocol> findById(String id);
}
