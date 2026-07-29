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

    public ProtocolOutputDto execute(ProtocolInputDto input, String userId, String requester) {
        if (input.category() == null || input.category().isBlank()
                || input.description() == null || input.description().isBlank()
                || input.address() == null || input.address().isBlank()) {
            throw new IllegalArgumentException("Preencha categoria, descrição e endereço.");
        }

        Protocol protocol = new Protocol();
        protocol.setCategory(input.category().trim());
        protocol.setDescription(input.description().trim());
        protocol.setAddress(input.address().trim());
        protocol.setUserId(userId);
        protocol.setRequester(requester);
        protocol.setStatus("Aberto");
        protocol.setAiStatus("pending");

        Protocol createdProtocol = repository.add(protocol);

        return ProtocolOutputDto.from(createdProtocol);
    }
}
