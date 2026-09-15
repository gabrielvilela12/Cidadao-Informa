package br.com.fiap.hackgov.infrastructure.repository;

import br.com.fiap.hackgov.domain.audit.AdministrativeAuditEvent;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.UUID;

@Repository
public interface AdministrativeAuditRepository extends JpaRepository<AdministrativeAuditEvent, UUID> {

    @Query("""
            select event from AdministrativeAuditEvent event
             where (:action is null or event.action = :action)
               and (:actorId is null or event.actorId = :actorId)
               and (:from is null or event.createdAt >= :from)
               and (:to is null or event.createdAt < :to)
             order by event.createdAt desc
            """)
    Page<AdministrativeAuditEvent> search(
            @Param("action") String action,
            @Param("actorId") String actorId,
            @Param("from") Instant from,
            @Param("to") Instant to,
            Pageable pageable
    );
}
