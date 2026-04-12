package br.com.fiap.hackgov.application.usecase.protocol;

import br.com.fiap.hackgov.application.dto.protocol.ProtocolOutputDto;
import br.com.fiap.hackgov.domain.entity.Protocol;
import br.com.fiap.hackgov.domain.repository.ProtocolRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class GetProtocolsUseCase {

    private final ProtocolRepository repository;

    public GetProtocolsUseCase(ProtocolRepository repository) {
        this.repository = repository;
    }

    public List<ProtocolOutputDto> execute(String userId) {
        List<Protocol> protocols = userId != null && !userId.isBlank()
                ? repository.getByUserId(userId)
                : repository.getAll();

        return protocols.stream()
                .map(protocol -> new ProtocolOutputDto(
                        protocol.getId(),
                        protocol.getCategory(),
                        protocol.getDescription(),
                        protocol.getAddress(),
                        protocol.getCreatedAt(),
                        protocol.getStatus().name(),
                        protocol.getUserId(),
                        protocol.getUser() != null ? protocol.getUser().getName() : "Unknown"
                ))
                .toList();
    }
}
