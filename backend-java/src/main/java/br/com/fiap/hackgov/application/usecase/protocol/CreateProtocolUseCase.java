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

        validateCoordinates(input.latitude(), input.longitude());

        Protocol protocol = new Protocol();
        protocol.setCategory(input.category().trim());
        protocol.setDescription(input.description().trim());
        protocol.setAddress(input.address().trim());
        protocol.setUserId(userId);
        protocol.setRequester(requester);
        protocol.setStatus("Aberto");
        protocol.setAiStatus("pending");
        // Sem a posicao marcada no mapa a equipe so tem o endereco em texto para
        // chegar ao local, entao ela e persistida junto do chamado.
        protocol.setLatitude(input.latitude());
        protocol.setLongitude(input.longitude());

        Protocol createdProtocol = repository.add(protocol);

        return ProtocolOutputDto.from(createdProtocol);
    }

    /**
     * Espelha as constraints da migracao V4 para o cliente receber uma mensagem
     * legivel em vez de um erro de banco. Latitude e longitude andam juntas:
     * uma coordenada sozinha nao localiza nada.
     */
    private void validateCoordinates(Double latitude, Double longitude) {
        if ((latitude == null) != (longitude == null)) {
            throw new IllegalArgumentException(
                    "Informe latitude e longitude juntas ou deixe as duas em branco."
            );
        }
        if (latitude == null) {
            return;
        }
        if (latitude.isNaN() || longitude.isNaN()
                || latitude < -90 || latitude > 90
                || longitude < -180 || longitude > 180) {
            throw new IllegalArgumentException("Coordenadas fora da faixa válida.");
        }
    }
}
