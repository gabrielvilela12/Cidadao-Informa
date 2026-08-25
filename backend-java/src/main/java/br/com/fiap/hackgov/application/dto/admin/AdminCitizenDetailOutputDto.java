package br.com.fiap.hackgov.application.dto.admin;

import br.com.fiap.hackgov.application.dto.protocol.ProtocolSummaryOutputDto;
import br.com.fiap.hackgov.domain.entity.Protocol;
import br.com.fiap.hackgov.domain.entity.User;

import java.time.Instant;
import java.util.List;

public record AdminCitizenDetailOutputDto(
        String id,
        String name,
        String email,
        String cpf,
        String phone,
        Instant createdAt,
        int protocolCount,
        int openProtocolCount,
        Instant lastProtocolAt,
        List<ProtocolSummaryOutputDto> protocols
) {
    public static AdminCitizenDetailOutputDto from(User citizen, List<Protocol> protocols) {
        AdminCitizenSummaryOutputDto summary = AdminCitizenSummaryOutputDto.from(citizen, protocols);
        return new AdminCitizenDetailOutputDto(
                summary.id(),
                summary.name(),
                summary.email(),
                summary.cpf(),
                summary.phone(),
                summary.createdAt(),
                summary.protocolCount(),
                summary.openProtocolCount(),
                summary.lastProtocolAt(),
                protocols.stream().map(ProtocolSummaryOutputDto::from).toList()
        );
    }
}
