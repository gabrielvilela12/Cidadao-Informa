package br.com.fiap.hackgov.infrastructure.security;

public record AuthenticatedUser(
        String userId,
        String name,
        String cpf,
        String role
) {
}
