package br.com.fiap.hackgov.infrastructure.persistence.repository;

import br.com.fiap.hackgov.domain.entity.Protocol;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.math.BigDecimal;
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
        BigDecimal getResolutionCost();
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

    List<TransparencyProtocolProjection> findAllProjectedByOrderByCreatedAtDesc();

    interface TransparencyProtocolProjection {
        String getId();
        String getCategory();
        String getAddress();
        Instant getCreatedAt();
        String getStatus();
        BigDecimal getResolutionCost();
        String getAiPriority();
        String getAiStatus();
        Double getLatitude();
        Double getLongitude();
    }

    long countByStatusIn(Collection<String> statuses);

    @Query("""
            select p.id as id, p.category as category, p.description as description,
                   p.address as address, p.createdAt as createdAt, p.status as status,
                   p.resolutionCost as resolutionCost, p.requester as requester,
                   p.aiPriority as aiPriority, p.correctionReport as correctionReport,
                   u.name as citizenName, u.email as citizenEmail,
                   u.cpf as citizenCpf, u.phone as citizenPhone
              from Protocol p join p.user u
             where p.status in :statuses
            """)
    List<ConclusionDocumentProjection> findConclusionDocumentData(
            @Param("statuses") Collection<String> statuses
    );

    @Query("""
            select p.id as id, p.category as category, p.description as description,
                   p.address as address, p.createdAt as createdAt, p.status as status,
                   p.resolutionCost as resolutionCost, p.requester as requester,
                   p.aiPriority as aiPriority, p.correctionReport as correctionReport,
                   u.name as citizenName, u.email as citizenEmail,
                   u.cpf as citizenCpf, u.phone as citizenPhone
              from Protocol p join p.user u
             where p.id = :id
            """)
    Optional<ConclusionDocumentProjection> findConclusionDocumentDataById(@Param("id") String id);

    interface ConclusionDocumentProjection {
        String getId();
        String getCategory();
        String getDescription();
        String getAddress();
        Instant getCreatedAt();
        String getStatus();
        BigDecimal getResolutionCost();
        String getRequester();
        String getAiPriority();
        String getCorrectionReport();
        String getCitizenName();
        String getCitizenEmail();
        String getCitizenCpf();
        String getCitizenPhone();
    }

    @Override
    @EntityGraph(attributePaths = "user")
    Optional<Protocol> findById(String id);
}
