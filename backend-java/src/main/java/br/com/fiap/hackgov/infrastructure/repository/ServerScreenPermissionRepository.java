package br.com.fiap.hackgov.infrastructure.repository;

import br.com.fiap.hackgov.domain.entity.ServerScreenPermission;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface ServerScreenPermissionRepository extends JpaRepository<ServerScreenPermission, UUID> {
    List<ServerScreenPermission> findAllByOrderByScreenKeyAsc();
    List<ServerScreenPermission> findByUserIdOrderByScreenKeyAsc(String userId);
    void deleteByUserId(String userId);
}
