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
import java.util.Set;

public interface JpaProtocolRepository extends JpaRepository<Protocol, String> {

    @EntityGraph(attributePaths = "user")
    List<Protocol> findAllByOrderByCreatedAtDesc();

    @EntityGraph(attributePaths = "user")
    List<Protocol> findByStateCodeInOrderByCreatedAtDesc(Collection<String> states);

    // Fila da geocodificacao: chamados que ainda nao tem posicao no mapa.
    List<Protocol> findByLatitudeIsNullOrderByCreatedAtDesc(Pageable pageable);

    long countByLatitudeIsNull();

    @EntityGraph(attributePaths = "user")
    List<Protocol> findByUserIdOrderByCreatedAtDesc(String userId);

    @EntityGraph(attributePaths = "user")
    List<Protocol> findByUserIdAndStateCodeInOrderByCreatedAtDesc(String userId, Collection<String> states);

    @EntityGraph(attributePaths = "user")
    List<Protocol> findByLocationKeyAndCauseKeyOrderByCreatedAtAsc(String locationKey, String causeKey);

    @EntityGraph(attributePaths = "user")
    List<Protocol> findByEstablishmentIdOrderByCreatedAtDesc(String establishmentId);

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
        String getStateCode();
        Instant getCreatedAt();
        String getStatus();
        BigDecimal getResolutionCost();
        String getUserId();
        String getEstablishmentId();
        String getCampaignId();
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
            select p.userId as userId,
                   count(p.id) as protocolCount,
                   sum(case when p.status in ('Concluido', 'Concluído', 'Resolved', 'Closed') then 0 else 1 end) as openProtocolCount,
                   max(p.createdAt) as lastProtocolAt
              from Protocol p
             group by p.userId
            """)
    List<CitizenProtocolStatsProjection> findCitizenProtocolStats();

    @Query("""
            select p.userId as userId,
                   count(p.id) as protocolCount,
                   sum(case when p.status in ('Concluido', 'Concluído', 'Resolved', 'Closed') then 0 else 1 end) as openProtocolCount,
                   max(p.createdAt) as lastProtocolAt
              from Protocol p
             where p.stateCode in :states
             group by p.userId
            """)
    List<CitizenProtocolStatsProjection> findCitizenProtocolStatsByStateCodeIn(
            @Param("states") Collection<String> states);

    interface CitizenProtocolStatsProjection {
        String getUserId();
        long getProtocolCount();
        long getOpenProtocolCount();
        Instant getLastProtocolAt();
    }

    @Query("""
            select p.id as id, p.category as category, p.address as address, p.stateCode as stateCode,
                   p.createdAt as createdAt, p.status as status, p.resolutionCost as resolutionCost
              from Protocol p
             where p.createdAt >= :start and p.createdAt < :end
            """)
    List<DailyReportProtocolProjection> findDailyReportDataCreatedBetween(
            @Param("start") Instant start, @Param("end") Instant end);

    @Query("""
            select p.id as id, p.category as category, p.address as address, p.stateCode as stateCode,
                   p.createdAt as createdAt, p.status as status, p.resolutionCost as resolutionCost
              from Protocol p
             where p.id in :ids
            """)
    List<DailyReportProtocolProjection> findDailyReportDataByIdIn(@Param("ids") Collection<String> ids);

    interface DailyReportProtocolProjection {
        String getId();
        String getCategory();
        String getAddress();
        String getStateCode();
        Instant getCreatedAt();
        String getStatus();
        BigDecimal getResolutionCost();
    }

    @Override
    @EntityGraph(attributePaths = "user")
    Optional<Protocol> findById(String id);
}
