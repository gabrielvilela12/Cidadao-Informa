package br.com.fiap.hackgov.application.usecase.protocol;

import br.com.fiap.hackgov.application.dto.protocol.ProtocolInputDto;
import br.com.fiap.hackgov.application.service.ServerStatePermissionService;
import br.com.fiap.hackgov.domain.entity.Protocol;
import br.com.fiap.hackgov.domain.repository.ProtocolRepository;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class CreateProtocolUseCaseTest {

    @Test
    void newReportInheritsStatusFromSameCauseAtSameLocation() {
        ProtocolRepository repository = mock(ProtocolRepository.class);
        ServerStatePermissionService permissions = mock(ServerStatePermissionService.class);
        CreateProtocolUseCase useCase = new CreateProtocolUseCase(repository, permissions);
        Protocol existing = new Protocol();
        existing.setStatus("Em Análise");
        when(permissions.resolveState("SP", "Praça da Sé, 10 - Sé, São Paulo - SP")).thenReturn("SP");
        when(repository.getByLocationAndCause(
                "praca da se 10 se sao paulo sp",
                "fisica|calcada sem rampa"
        )).thenReturn(List.of(existing));
        when(repository.add(any(Protocol.class))).thenAnswer(invocation -> {
            Protocol created = invocation.getArgument(0);
            created.setId("new-protocol");
            created.prePersist();
            return created;
        });

        var output = useCase.execute(new ProtocolInputDto(
                "Física",
                "Calçada sem rampa - Bloqueia a entrada do posto",
                "Praça da Sé, 10 - Sé, São Paulo - SP",
                "SP",
                -23.5505,
                -46.6333,
                List.of()
        ), "citizen-2", "Maria");

        assertEquals("Em Análise", output.status());
    }

    @Test
    void differentCauseAtSameLocationStartsOpen() {
        ProtocolRepository repository = mock(ProtocolRepository.class);
        ServerStatePermissionService permissions = mock(ServerStatePermissionService.class);
        CreateProtocolUseCase useCase = new CreateProtocolUseCase(repository, permissions);
        when(permissions.resolveState("SP", "Praça da Sé, 10 - Sé, São Paulo - SP")).thenReturn("SP");
        when(repository.getByLocationAndCause(
                "praca da se 10 se sao paulo sp",
                "visual|piso tatil interrompido"
        )).thenReturn(List.of());
        when(repository.add(any(Protocol.class))).thenAnswer(invocation -> {
            Protocol created = invocation.getArgument(0);
            created.setId("new-protocol");
            created.prePersist();
            return created;
        });

        var output = useCase.execute(new ProtocolInputDto(
                "Visual",
                "Piso tátil interrompido - Em frente ao portão",
                "Praça da Sé, 10 - Sé, São Paulo - SP",
                "SP",
                -23.5505,
                -46.6333,
                List.of()
        ), "citizen-3", "João");

        assertEquals("Aberto", output.status());
    }
}
