package br.com.fiap.hackgov.application.dto.protocol;

public record ProtocolInputDto(
        String category,
        String description,
        String address,
        String userId
) {
}
