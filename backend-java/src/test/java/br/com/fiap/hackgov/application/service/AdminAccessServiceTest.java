package br.com.fiap.hackgov.application.service;

import br.com.fiap.hackgov.domain.entity.ServerScreenPermission;
import br.com.fiap.hackgov.domain.entity.User;
import br.com.fiap.hackgov.domain.repository.UserRepository;
import br.com.fiap.hackgov.infrastructure.repository.ServerScreenPermissionRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.Set;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class AdminAccessServiceTest {
    private final ServerScreenPermissionRepository screens = mock(ServerScreenPermissionRepository.class);
    private final ServerStatePermissionService states = mock(ServerStatePermissionService.class);
    private final UserRepository users = mock(UserRepository.class);
    private final AdminAccessService service = new AdminAccessService(screens, states, users);

    @BeforeEach
    void actorPermissions() {
        when(states.allowedStates("actor")).thenReturn(Set.of("SP", "RJ"));
        when(screens.findByUserIdOrderByScreenKeyAsc("actor")).thenReturn(List.of(
                screen("actor", AdminAccessService.USER_MANAGEMENT),
                screen("actor", AdminAccessService.CITIZENS)
        ));
    }

    @Test
    void rejectsStateOutsideCreatorsScope() {
        assertThrows(AdminAccessService.AdminAccessDeniedException.class, () -> service.create(
                "actor", "Novo Admin", "novo@gov.br", "12345678901", "senha123",
                List.of("BA"), List.of(AdminAccessService.CITIZENS)
        ));

        verify(users, never()).add(any(User.class));
    }

    @Test
    void rejectsScreenOutsideCreatorsScope() {
        assertThrows(AdminAccessService.AdminAccessDeniedException.class, () -> service.create(
                "actor", "Novo Admin", "novo@gov.br", "12345678901", "senha123",
                List.of("SP"), List.of(AdminAccessService.REPORTS)
        ));
    }

    @Test
    void createsAdminWithDelegatedSubset() {
        when(users.getByCpf("12345678901")).thenReturn(Optional.empty());
        when(users.getByEmail("novo@gov.br")).thenReturn(Optional.empty());
        when(users.add(any(User.class))).thenAnswer(invocation -> {
            User user = invocation.getArgument(0);
            user.setId("created");
            user.setCreatedAt(Instant.parse("2026-08-25T12:00:00Z"));
            return user;
        });

        var result = service.create(
                "actor", "Novo Admin", "NOVO@GOV.BR ", "123.456.789-01", "senha123",
                List.of("SP"), List.of(AdminAccessService.CITIZENS)
        );

        assertEquals("created", result.userId());
        assertEquals(List.of("SP"), result.states());
        assertEquals(List.of(AdminAccessService.CITIZENS), result.screens());
        verify(states).update("created", List.of("SP"));
        verify(screens).save(any(ServerScreenPermission.class));
    }

    @Test
    void preventsEditingMorePrivilegedAdministrator() {
        User target = admin("target");
        when(users.getById("target")).thenReturn(Optional.of(target));
        when(states.allowedStates("target")).thenReturn(Set.of("SP", "BA"));
        when(screens.findByUserIdOrderByScreenKeyAsc("target")).thenReturn(List.of(
                screen("target", AdminAccessService.USER_MANAGEMENT)
        ));

        assertThrows(AdminAccessService.AdminAccessDeniedException.class, () -> service.update(
                "actor", "target", List.of("SP"), List.of()
        ));
    }

    @Test
    void grantsMandatoryScreensToEveryAdminProfile() {
        var profile = service.profile("actor");

        assertTrue(profile.screens().containsAll(AdminAccessService.MANDATORY_SCREENS));
        assertTrue(profile.screens().contains(AdminAccessService.USER_MANAGEMENT));
    }

    private ServerScreenPermission screen(String userId, String key) {
        ServerScreenPermission permission = new ServerScreenPermission();
        permission.setUserId(userId);
        permission.setScreenKey(key);
        return permission;
    }

    private User admin(String id) {
        User user = new User();
        user.setId(id);
        user.setRole("admin");
        user.setName("Admin");
        user.setEmail(id + "@gov.br");
        return user;
    }
}
