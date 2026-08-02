package br.com.fiap.hackgov.application.usecase.protocol;

import br.com.fiap.hackgov.application.dto.protocol.PublicStatsOutputDto;
import br.com.fiap.hackgov.domain.repository.ProtocolRepository;
import br.com.fiap.hackgov.domain.repository.UserRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class GetPublicStatsUseCase {

    private static final List<String> RESOLVED_STATUSES = List.of(
            "Concluido",
            "Concluído",
            "Resolved",
            "Closed"
    );

    private final ProtocolRepository protocolRepository;
    private final UserRepository userRepository;

    public GetPublicStatsUseCase(
            ProtocolRepository protocolRepository,
            UserRepository userRepository
    ) {
        this.protocolRepository = protocolRepository;
        this.userRepository = userRepository;
    }

    public PublicStatsOutputDto execute() {
        long total = protocolRepository.countAll();
        long resolved = protocolRepository.countByStatuses(RESOLVED_STATUSES);
        Integer resolutionRate = total == 0
                ? null
                : (int) Math.round((resolved * 100.0) / total);
        long citizens = userRepository.countByRole("citizen");

        return new PublicStatsOutputDto(total, resolved, resolutionRate, citizens);
    }
}
