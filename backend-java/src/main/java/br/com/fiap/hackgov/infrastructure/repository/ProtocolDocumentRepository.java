package br.com.fiap.hackgov.infrastructure.repository;

import br.com.fiap.hackgov.domain.document.ProtocolDocument;
import br.com.fiap.hackgov.domain.document.ProtocolDocumentType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface ProtocolDocumentRepository extends JpaRepository<ProtocolDocument, UUID> {
    @Query(value = "select 1 from pg_advisory_xact_lock(hashtextextended(:lockKey, 0))", nativeQuery = true)
    Integer acquireTransactionLock(@Param("lockKey") String lockKey);

    Optional<ProtocolDocument> findFirstByProtocolIdAndDocumentTypeOrderByVersionDesc(
            String protocolId,
            ProtocolDocumentType documentType
    );

    Optional<ProtocolDocument> findByProtocolIdAndDocumentTypeAndSourceHash(
            String protocolId,
            ProtocolDocumentType documentType,
            String sourceHash
    );
}
