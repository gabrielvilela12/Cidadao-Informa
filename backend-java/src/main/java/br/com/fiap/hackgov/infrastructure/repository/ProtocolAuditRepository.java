package br.com.fiap.hackgov.infrastructure.repository;

import br.com.fiap.hackgov.domain.audit.ProtocolAuditBlock;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface ProtocolAuditRepository extends JpaRepository<ProtocolAuditBlock, UUID> {

    Optional<ProtocolAuditBlock> findFirstByOrderByBlockIndexDesc();

    List<ProtocolAuditBlock> findByProtocolIdOrderByBlockIndexAsc(String protocolId);

    List<ProtocolAuditBlock> findAllByOrderByBlockIndexAsc();
}
