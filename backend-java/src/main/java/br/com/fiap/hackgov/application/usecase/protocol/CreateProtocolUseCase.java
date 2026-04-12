package br.com.fiap.hackgov.application.usecase.protocol;

import br.com.fiap.hackgov.application.dto.protocol.ProtocolInputDto;
import br.com.fiap.hackgov.application.dto.protocol.ProtocolOutputDto;
import br.com.fiap.hackgov.domain.entity.Protocol;
import br.com.fiap.hackgov.domain.repository.ProtocolRepository;
import org.springframework.stereotype.Service;

@Service
public class CreateProtocolUseCase {

    private final ProtocolRepository repository;

    public CreateProtocolUseCase(ProtocolRepository repository) {
        this.repository = repository;
    }

    public ProtocolOutputDto execute(ProtocolInputDto input) {
        Protocol protocol = new Protocol();
        protocol.setCategory(input.category());
        protocol.setDescription(input.description());
        protocol.setAddress(input.address());
        protocol.setUserId(input.userId());

        Protocol createdProtocol = repository.add(protocol);

        return new ProtocolOutputDto(
                createdProtocol.getId(),
                createdProtocol.getCategory(),
                createdProtocol.getDescription(),
                createdProtocol.getAddress(),
                createdProtocol.getCreatedAt(),
                createdProtocol.getStatus().name(),
                createdProtocol.getUserId(),
                ""
        );
    }
}
