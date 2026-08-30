package br.com.fiap.hackgov.application.dto.protocol;

import br.com.fiap.hackgov.domain.entity.Protocol;

import java.math.BigDecimal;
import java.time.Instant;

/**
 * Protocolo para listagem, sem os campos de imagem.
 *
 * Motivacao: as fotos sao gravadas como data URL base64 dentro das colunas
 * jsonb `image_urls` e `corrected_image_urls` - o formulario aceita 4 imagens de
 * ate 2,8 MB cada (MAX_IMAGES e MAX_STORED_IMAGE_LENGTH em NewRequest.tsx), e a
 * correcao gerada pela IA volta em base64 tambem. Como GET /api/protocols usava
 * ProtocolOutputDto, cada listagem carregava todas as fotos de todos os
 * protocolos: dezenas de MB de JSON numa rota que TODA tela do app chama, o que
 * fazia qualquer navegacao levar mais de 15 segundos com meia duzia de chamados.
 *
 * Nenhuma tela de listagem usa imagem: quem exibe foto e ProtocolDetails e
 * PublicProtocol, e as duas buscam um protocolo por ID, onde os campos
 * completos continuam disponiveis via ProtocolOutputDto.
 *
 * O `correctionReport` tambem fica fora por ser texto longo gerado pela IA e
 * consumido apenas na tela de detalhe.
 */
public record ProtocolSummaryOutputDto(
        String id,
        String category,
        String description,
        String address,
        String stateCode,
        Instant createdAt,
        String status,
        BigDecimal resolutionCost,
        String userId,
        String establishmentId,
        String campaignId,
        String requester,
        String phone,
        String aiPriority,
        String aiStatus,
        Double latitude,
        Double longitude,
        String correctionStatus,
        String correctionError,
        Instant correctionGeneratedAt,
        int locationGroupCount,
        boolean locationGrouped,
        boolean locationAlert,
        String primaryProtocolId
) {
    public static ProtocolSummaryOutputDto from(Protocol protocol) {
        return new ProtocolSummaryOutputDto(
                protocol.getId(),
                protocol.getCategory(),
                protocol.getDescription(),
                protocol.getAddress(),
                protocol.getStateCode(),
                protocol.getCreatedAt(),
                protocol.getStatus(),
                protocol.getResolutionCost(),
                protocol.getUserId(),
                protocol.getEstablishmentId(),
                protocol.getCampaignId(),
                protocol.getRequester(),
                protocol.getUser() != null ? protocol.getUser().getPhone() : null,
                protocol.getAiPriority(),
                protocol.getAiStatus(),
                protocol.getLatitude(),
                protocol.getLongitude(),
                protocol.getCorrectionStatus(),
                protocol.getCorrectionError(),
                protocol.getCorrectionGeneratedAt(),
                1,
                false,
                false,
                protocol.getId()
        );
    }

    public static ProtocolSummaryOutputDto from(
            Protocol protocol,
            int locationGroupCount,
            boolean locationGrouped,
            boolean locationAlert,
            String primaryProtocolId
    ) {
        ProtocolSummaryOutputDto base = from(protocol);
        return new ProtocolSummaryOutputDto(
                base.id(), base.category(), base.description(), base.address(), base.stateCode(),
                base.createdAt(), base.status(), base.resolutionCost(), base.userId(), base.establishmentId(),
                base.campaignId(), base.requester(), base.phone(), base.aiPriority(), base.aiStatus(), base.latitude(), base.longitude(),
                base.correctionStatus(), base.correctionError(), base.correctionGeneratedAt(),
                locationGroupCount, locationGrouped, locationAlert, primaryProtocolId
        );
    }

    /** Cria o payload leve do SSE sem reenviar as imagens em base64. */
    public static ProtocolSummaryOutputDto from(ProtocolOutputDto protocol) {
        return new ProtocolSummaryOutputDto(
                protocol.id(),
                protocol.category(),
                protocol.description(),
                protocol.address(),
                protocol.stateCode(),
                protocol.createdAt(),
                protocol.status(),
                protocol.resolutionCost(),
                protocol.userId(),
                protocol.establishmentId(),
                protocol.campaignId(),
                protocol.requester(),
                protocol.phone(),
                protocol.aiPriority(),
                protocol.aiStatus(),
                protocol.latitude(),
                protocol.longitude(),
                protocol.correctionStatus(),
                protocol.correctionError(),
                protocol.correctionGeneratedAt(),
                protocol.locationGroupCount(),
                protocol.locationGrouped(),
                protocol.locationAlert(),
                protocol.primaryProtocolId()
        );
    }
}
