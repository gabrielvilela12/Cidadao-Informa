package br.com.fiap.hackgov.application.dto.protocol;

import br.com.fiap.hackgov.domain.entity.Protocol;

import java.time.Instant;

/** Pessoa e protocolo que compoem um chamado agrupado. Disponivel apenas ao servidor. */
public record LocationReportOutputDto(
        String protocolId,
        String requester,
        String phone,
        Instant createdAt,
        String category,
        String status
) {
    public static LocationReportOutputDto from(Protocol protocol) {
        return new LocationReportOutputDto(
                protocol.getId(),
                protocol.getRequester(),
                protocol.getUser() != null ? protocol.getUser().getPhone() : null,
                protocol.getCreatedAt(),
                protocol.getCategory(),
                protocol.getStatus()
        );
    }
}
