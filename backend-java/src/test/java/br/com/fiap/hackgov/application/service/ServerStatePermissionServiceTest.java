package br.com.fiap.hackgov.application.service;

import br.com.fiap.hackgov.domain.entity.Protocol;
import br.com.fiap.hackgov.domain.entity.ServerStatePermission;
import br.com.fiap.hackgov.domain.entity.User;
import br.com.fiap.hackgov.domain.repository.UserRepository;
import br.com.fiap.hackgov.infrastructure.repository.ServerStatePermissionRepository;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;

import java.util.List;
import java.util.Optional;
import java.util.Set;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.when;

class ServerStatePermissionServiceTest {
    private final ServerStatePermissionRepository repository = mock(ServerStatePermissionRepository.class);
    private final UserRepository users = mock(UserRepository.class);
    private final ServerStatePermissionService service = new ServerStatePermissionService(repository, users);

    @Test
    void resolvesUfFromCodeFullNameAndAddress() {
        assertEquals("SP", service.resolveState("sp", "qualquer endereço"));
        assertEquals("SP", service.resolveState("São Paulo", "qualquer endereço"));
        assertEquals("RN", service.resolveState(null, "Rua Central, Natal - Rio Grande do Norte"));
        assertEquals("DF", service.resolveState(null, "Brasília - DF"));
        assertEquals("SP", service.resolveState(null, "Av. Paulista, 1000 - São Paulo/SP"));
    }

    @Test
    void replacesServerPermissionsAndRemovesDuplicates() {
        User admin = new User();
        admin.setId("admin-1");
        admin.setRole("admin");
        admin.setName("Admin");
        admin.setEmail("admin@gov.br");
        when(users.getById("admin-1")).thenReturn(Optional.of(admin));

        var result = service.update("admin-1", List.of("sp", "SP", "Rio de Janeiro"));

        assertEquals(List.of("SP", "RJ"), result.states());
        verify(repository).deleteByUserId("admin-1");
        ArgumentCaptor<ServerStatePermission> captor = ArgumentCaptor.forClass(ServerStatePermission.class);
        verify(repository, org.mockito.Mockito.times(2)).save(captor.capture());
        assertEquals(Set.of("SP", "RJ"), captor.getAllValues().stream()
                .map(ServerStatePermission::getStateCode).collect(java.util.stream.Collectors.toSet()));
    }

    @Test
    void checksProtocolAgainstAllowedStatesAndRejectsInvalidUf() {
        Protocol protocol = new Protocol();
        protocol.setStateCode("SP");
        assertTrue(service.canAccess(protocol, Set.of("SP", "RJ")));
        assertFalse(service.canAccess(protocol, Set.of("MG")));
        assertThrows(IllegalArgumentException.class,
                () -> service.resolveState("XX", "Rua sem UF"));
    }

    @Test
    void masterAlwaysHasNationalAccess() {
        User master = new User();
        master.setId("master-1");
        master.setRole("master");
        when(users.getById("master-1")).thenReturn(Optional.of(master));

        assertEquals(Set.copyOf(ServerStatePermissionService.ALL_STATES), service.allowedStates("master-1"));
        verify(repository, never()).findByUserIdOrderByStateCodeAsc("master-1");
    }
}
