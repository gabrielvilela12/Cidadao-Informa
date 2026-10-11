package br.com.fiap.hackgov.application.service;

import br.com.fiap.hackgov.application.dto.protocol.OperationalAnalyticsOutputDto;
import br.com.fiap.hackgov.infrastructure.repository.OperationalAnalyticsRepository;
import br.com.fiap.hackgov.infrastructure.security.AuthenticatedUser;
import br.com.fiap.hackgov.infrastructure.security.RoleAccess;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Isolation;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDate;
import java.time.ZoneId;
import java.time.temporal.ChronoUnit;
import java.util.Set;

@Service
public class OperationalAnalyticsService {
    public static final ZoneId ZONE = ZoneId.of("America/Sao_Paulo");
    private final OperationalAnalyticsRepository repository;
    private final ServerStatePermissionService permissions;

    public OperationalAnalyticsService(OperationalAnalyticsRepository repository, ServerStatePermissionService permissions) {
        this.repository = repository;
        this.permissions = permissions;
    }

    @Transactional(readOnly = true, isolation = Isolation.REPEATABLE_READ)
    public OperationalAnalyticsOutputDto get(AuthenticatedUser user, LocalDate start, LocalDate end) {
        if (!RoleAccess.isAdministrative(user.role())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Acesso restrito a administradores.");
        }
        if (start == null || end == null || start.isAfter(end) || ChronoUnit.DAYS.between(start, end) > 730) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Informe um período válido de até 731 dias.");
        }
        boolean global = RoleAccess.isPlatformOwner(user.role());
        String establishment = !global && user.establishmentId() != null && !user.establishmentId().isBlank()
                ? user.establishmentId() : null;
        Set<String> states = global || establishment != null ? Set.of() : permissions.allowedStates(user.userId());
        return repository.query(start, end, start.atStartOfDay(ZONE).toInstant(),
                end.plusDays(1).atStartOfDay(ZONE).toInstant(), global, establishment, states);
    }
}
