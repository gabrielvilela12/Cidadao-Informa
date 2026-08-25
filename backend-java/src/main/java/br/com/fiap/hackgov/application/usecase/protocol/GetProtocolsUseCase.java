package br.com.fiap.hackgov.application.usecase.protocol;

import br.com.fiap.hackgov.application.dto.protocol.ProtocolSummaryOutputDto;
import br.com.fiap.hackgov.domain.entity.Protocol;
import br.com.fiap.hackgov.domain.repository.ProtocolRepository;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Set;

@Service
public class GetProtocolsUseCase {

    private final ProtocolRepository repository;

    public GetProtocolsUseCase(ProtocolRepository repository) {
        this.repository = repository;
    }

    /**
     * Listagem sem os campos de imagem. Ver ProtocolSummaryOutputDto: as fotos
     * ficam em base64 no banco, e devolve-las aqui tornava esta rota - chamada
     * por toda tela do app - uma resposta de dezenas de MB.
     */
    public List<ProtocolSummaryOutputDto> execute(String userId) {
        List<Protocol> protocols = userId != null && !userId.isBlank()
                ? repository.getByUserId(userId)
                : repository.getAll();

        return protocols.stream()
                .map(ProtocolSummaryOutputDto::from)
                .toList();
    }

    public List<ProtocolSummaryOutputDto> executeForAdmin(Set<String> allowedStates) {
        return repository.getByStates(allowedStates).stream()
                .map(ProtocolSummaryOutputDto::from)
                .toList();
    }
}
