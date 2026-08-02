package br.com.fiap.hackgov.application.dto.protocol;

public record PublicStatsOutputDto(
        long total,
        long resolved,
        Integer resolutionRate,
        long citizens
) {
}
