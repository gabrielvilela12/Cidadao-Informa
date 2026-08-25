package br.com.fiap.hackgov.application.usecase.admin;

import br.com.fiap.hackgov.application.dto.admin.AdminCitizenDetailOutputDto;
import br.com.fiap.hackgov.application.dto.admin.AdminCitizenSummaryOutputDto;
import br.com.fiap.hackgov.domain.entity.Protocol;
import br.com.fiap.hackgov.domain.entity.User;
import br.com.fiap.hackgov.domain.repository.ProtocolRepository;
import br.com.fiap.hackgov.domain.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.Set;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class GetAdminCitizensUseCaseTest {
    @Mock
    private UserRepository userRepository;

    @Mock
    private ProtocolRepository protocolRepository;

    @InjectMocks
    private GetAdminCitizensUseCase useCase;

    @Test
    void listsOnlyCitizensWithProtocolsInAllowedStates() {
        User ana = citizen("ana", "Ana", "11999999999");
        User bruno = citizen("bruno", "Bruno", null);
        when(userRepository.getByRole("citizen")).thenReturn(List.of(ana, bruno));
        when(protocolRepository.getCitizenStatsByStates(Set.of("SP"))).thenReturn(List.of(
                new ProtocolRepository.CitizenProtocolStats(
                        "ana", 2, 1, Instant.parse("2026-08-21T10:00:00Z")
                )
        ));

        List<AdminCitizenSummaryOutputDto> result = useCase.list(Set.of("SP"));

        assertEquals(1, result.size());
        assertEquals(2, result.get(0).protocolCount());
        assertEquals(1, result.get(0).openProtocolCount());
        assertEquals(Instant.parse("2026-08-21T10:00:00Z"), result.get(0).lastProtocolAt());
    }

    @Test
    void returnsCitizenWithCompleteProtocolHistory() {
        User citizen = citizen("ana", "Ana", "11999999999");
        Protocol protocol = protocol("p-1", "ana", "Aberto", "2026-08-20T10:00:00Z");
        when(userRepository.getById("ana")).thenReturn(Optional.of(citizen));
        when(protocolRepository.getByUserIdAndStates("ana", Set.of("SP"))).thenReturn(List.of(protocol));

        AdminCitizenDetailOutputDto result = useCase.detail("ana", Set.of("SP"));

        assertEquals("Ana", result.name());
        assertEquals(1, result.protocolCount());
        assertEquals("p-1", result.protocols().getFirst().id());
    }

    @Test
    void rejectsNonCitizenRecords() {
        User admin = citizen("admin", "Administrador", null);
        admin.setRole("admin");
        when(userRepository.getById("admin")).thenReturn(Optional.of(admin));

        assertThrows(GetAdminCitizensUseCase.CitizenNotFoundException.class,
                () -> useCase.detail("admin", Set.of("SP")));
    }

    private User citizen(String id, String name, String phone) {
        User user = new User();
        user.setId(id);
        user.setName(name);
        user.setEmail(name.toLowerCase() + "@email.com");
        user.setCpf("12345678901");
        user.setPhone(phone);
        user.setRole("citizen");
        user.setCreatedAt(Instant.parse("2026-08-01T10:00:00Z"));
        return user;
    }

    private Protocol protocol(String id, String userId, String status, String createdAt) {
        Protocol protocol = new Protocol();
        protocol.setId(id);
        protocol.setUserId(userId);
        protocol.setRequester("Ana");
        protocol.setCategory("Física");
        protocol.setDescription("Calçada danificada");
        protocol.setAddress("Rua das Flores, 100");
        protocol.setStateCode("SP");
        protocol.setStatus(status);
        protocol.setCreatedAt(Instant.parse(createdAt));
        return protocol;
    }
}
