package br.com.fiap.hackgov.application.dto.protocol;

import java.time.Instant;

public record ProtocolOutputDto(
        String id,
        String category,
        String description,
        String address,
        Instant createdAt,
        String status,
        String userId,
        String userName
) {
}
