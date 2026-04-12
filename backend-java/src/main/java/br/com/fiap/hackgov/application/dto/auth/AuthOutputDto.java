package br.com.fiap.hackgov.application.dto.auth;

import java.time.Instant;

public record AuthOutputDto(
        String token,
        String name,
        String email,
        String cpf,
        String role,
        String userId,
        Instant createdAt
) {
}
