package br.com.fiap.hackgov.application.dto.protocol;

import java.util.List;

public record ProtocolInputDto(
        String category,
        String description,
        String address,
        String stateCode,
        // Ponto que o solicitante marcou no mapa. Pode vir null quando o cliente
        // nao conseguiu confirmar a posicao; o par latitude/longitude e sempre
        // gravado junto ou nao gravado.
        Double latitude,
        Double longitude,
        List<String> imageUrls
) {
}
