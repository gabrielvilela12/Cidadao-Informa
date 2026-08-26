package br.com.fiap.hackgov.infrastructure.security;

public record AuthenticatedUser(
        String userId,
        String name,
        String cpf,
        String role,
        String establishmentId
) {
    public AuthenticatedUser(String userId, String name, String cpf, String role) {
        this(userId, name, cpf, role, null);
    }
}
