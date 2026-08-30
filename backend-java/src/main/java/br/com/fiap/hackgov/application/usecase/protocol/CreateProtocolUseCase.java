package br.com.fiap.hackgov.application.usecase.protocol;

import br.com.fiap.hackgov.application.dto.protocol.ProtocolInputDto;
import br.com.fiap.hackgov.application.dto.protocol.ProtocolOutputDto;
import br.com.fiap.hackgov.application.service.RegionalCampaignRoutingService;
import br.com.fiap.hackgov.domain.entity.Protocol;
import br.com.fiap.hackgov.domain.campaign.RegionalCampaign;
import br.com.fiap.hackgov.domain.repository.ProtocolRepository;
import br.com.fiap.hackgov.application.service.ServerStatePermissionService;
import br.com.fiap.hackgov.domain.util.ProtocolLocationKey;
import br.com.fiap.hackgov.domain.util.ProtocolCauseKey;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class CreateProtocolUseCase {

    private static final int MAX_IMAGES = 4;
    private static final int MAX_IMAGE_DATA_URL_LENGTH = 2_800_000;

    private final ProtocolRepository repository;
    private final ServerStatePermissionService permissionService;
    private final RegionalCampaignRoutingService campaignRoutingService;

    public CreateProtocolUseCase(ProtocolRepository repository,
                                 ServerStatePermissionService permissionService,
                                 RegionalCampaignRoutingService campaignRoutingService) {
        this.repository = repository;
        this.permissionService = permissionService;
        this.campaignRoutingService = campaignRoutingService;
    }

    public ProtocolOutputDto execute(
            ProtocolInputDto input,
            String userId,
            String requester
    ) {
        if (input.category() == null || input.category().isBlank()
                || input.description() == null || input.description().isBlank()
                || input.address() == null || input.address().isBlank()) {
            throw new IllegalArgumentException("Preencha categoria, descrição e endereço.");
        }

        validateCoordinates(input.latitude(), input.longitude());
        List<String> imageUrls = validateImages(input.imageUrls());
        String stateCode = permissionService.resolveState(input.stateCode(), input.address());
        RegionalCampaign campaign = campaignRoutingService.resolveActiveCampaign(
                input.city(),
                input.address(),
                stateCode
        );

        Protocol protocol = new Protocol();
        protocol.setCategory(input.category().trim());
        protocol.setDescription(input.description().trim());
        protocol.setAddress(input.address().trim());
        protocol.setLocationKey(ProtocolLocationKey.fromAddress(input.address()));
        protocol.setCauseKey(ProtocolCauseKey.from(input.category(), input.description()));
        if (protocol.getLocationKey() == null || protocol.getLocationKey().isBlank()
                || protocol.getCauseKey() == null || protocol.getCauseKey().isBlank()) {
            throw new IllegalArgumentException("Informe um endereço e uma causa válidos.");
        }
        protocol.setStateCode(stateCode);
        protocol.setUserId(userId);
        protocol.setEstablishmentId(campaign.getEstablishmentId());
        protocol.setCampaignId(campaign.getId());
        protocol.setRequester(requester);
        // Um novo relato da mesma causa no mesmo local entra no andamento que
        // ja existe. A partir do segundo protocolo o grupo nasce sincronizado.
        String sharedStatus = repository.getByLocationAndCause(
                        protocol.getLocationKey(),
                        protocol.getCauseKey()
                ).stream()
                .findFirst()
                .map(Protocol::getStatus)
                .orElse("Aberto");
        protocol.setStatus(sharedStatus);
        protocol.setAiStatus("pending");
        // Sem a posicao marcada no mapa a equipe so tem o endereco em texto para
        // chegar ao local, entao ela e persistida junto do chamado.
        protocol.setLatitude(input.latitude());
        protocol.setLongitude(input.longitude());
        protocol.setImageUrls(imageUrls);

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

    private List<String> validateImages(List<String> imageUrls) {
        if (imageUrls == null || imageUrls.isEmpty()) {
            return List.of();
        }
        if (imageUrls.size() > MAX_IMAGES) {
            throw new IllegalArgumentException("Envie no máximo 4 fotos.");
        }

        return imageUrls.stream().map(imageUrl -> {
            if (imageUrl == null
                    || !(imageUrl.startsWith("data:image/jpeg;base64,")
                    || imageUrl.startsWith("data:image/png;base64,"))) {
                throw new IllegalArgumentException("Formato de imagem inválido. Use JPG ou PNG.");
            }
            if (imageUrl.length() > MAX_IMAGE_DATA_URL_LENGTH) {
                throw new IllegalArgumentException("Uma das fotos excede o tamanho permitido.");
            }
            return imageUrl;
        }).toList();
    }
}
