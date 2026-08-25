package br.com.fiap.hackgov.application.dto.admin;

import java.time.Instant;
import java.util.List;

public record AdminUserAccessOutputDto(
        String userId,
        String name,
        String email,
        Instant createdAt,
        List<String> states,
        List<String> screens
) {
}
