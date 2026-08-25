package br.com.fiap.hackgov.application.dto.admin;

import java.time.Instant;
import java.util.List;

public record ServerPermissionOutputDto(
        String userId,
        String name,
        String email,
        Instant createdAt,
        List<String> states
) {
}
