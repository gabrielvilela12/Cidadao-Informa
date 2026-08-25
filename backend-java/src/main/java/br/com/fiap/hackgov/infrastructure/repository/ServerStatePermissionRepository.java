package br.com.fiap.hackgov.infrastructure.repository;

import br.com.fiap.hackgov.domain.entity.ServerStatePermission;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface ServerStatePermissionRepository extends JpaRepository<ServerStatePermission, UUID> {
    List<ServerStatePermission> findAllByOrderByStateCodeAsc();
    List<ServerStatePermission> findByUserIdOrderByStateCodeAsc(String userId);
    void deleteByUserId(String userId);
}
