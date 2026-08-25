package br.com.fiap.hackgov.application.dto.admin;

import java.time.Instant;
import java.util.List;

public record AdminUserAccessOutputDto(
        String userId,
        String name,
        String email,
        String role,
        Instant createdAt,
        List<String> states,
        List<String> screens
) {
}
