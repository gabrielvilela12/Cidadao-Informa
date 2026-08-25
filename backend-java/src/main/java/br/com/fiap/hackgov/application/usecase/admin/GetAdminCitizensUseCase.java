package br.com.fiap.hackgov.application.usecase.admin;

import br.com.fiap.hackgov.application.dto.admin.AdminCitizenDetailOutputDto;
import br.com.fiap.hackgov.application.dto.admin.AdminCitizenSummaryOutputDto;
import br.com.fiap.hackgov.domain.entity.User;
import br.com.fiap.hackgov.domain.repository.ProtocolRepository;
import br.com.fiap.hackgov.domain.repository.UserRepository;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

@Service
public class GetAdminCitizensUseCase {
    private final UserRepository userRepository;
    private final ProtocolRepository protocolRepository;

    public GetAdminCitizensUseCase(UserRepository userRepository, ProtocolRepository protocolRepository) {
        this.userRepository = userRepository;
        this.protocolRepository = protocolRepository;
    }

    public List<AdminCitizenSummaryOutputDto> list(Set<String> allowedStates) {
        Map<String, ProtocolRepository.CitizenProtocolStats> statsByCitizen = protocolRepository
                .getCitizenStatsByStates(allowedStates).stream()
                .collect(Collectors.toMap(ProtocolRepository.CitizenProtocolStats::userId, stats -> stats));

        return userRepository.getByRole("citizen").stream()
                .filter(citizen -> statsByCitizen.containsKey(citizen.getId()))
                .map(citizen -> {
                    ProtocolRepository.CitizenProtocolStats stats = statsByCitizen.get(citizen.getId());
                    return stats == null
                            ? AdminCitizenSummaryOutputDto.from(citizen, 0, 0, null)
                            : AdminCitizenSummaryOutputDto.from(
                                    citizen,
                                    stats.protocolCount(),
                                    stats.openProtocolCount(),
                                    stats.lastProtocolAt()
                            );
                })
                .toList();
    }

    public AdminCitizenDetailOutputDto detail(String citizenId, Set<String> allowedStates) {
        User citizen = userRepository.getById(citizenId)
                .filter(user -> "citizen".equalsIgnoreCase(user.getRole()))
                .orElseThrow(() -> new CitizenNotFoundException(citizenId));

        var protocols = protocolRepository.getByUserIdAndStates(citizenId, allowedStates);
        if (protocols.isEmpty()) throw new CitizenNotFoundException(citizenId);
        return AdminCitizenDetailOutputDto.from(citizen, protocols);
    }

    public static class CitizenNotFoundException extends RuntimeException {
        public CitizenNotFoundException(String citizenId) {
            super("Cidadão não encontrado: " + citizenId);
        }
    }
}
