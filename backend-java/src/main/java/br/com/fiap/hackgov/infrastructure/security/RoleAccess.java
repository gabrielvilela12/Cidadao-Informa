package br.com.fiap.hackgov.infrastructure.security;

import java.util.Locale;
import java.util.Set;

public final class RoleAccess {

    public static final String PLATFORM_OWNER = "platform_owner";
    public static final String ESTABLISHMENT_OWNER = "establishment_owner";
    public static final String ADMIN = "admin";
    public static final String CITIZEN = "citizen";

    private static final Set<String> ADMINISTRATIVE_ROLES = Set.of(
            PLATFORM_OWNER,
            ESTABLISHMENT_OWNER,
            ADMIN
    );

    private RoleAccess() {
    }

    public static String normalize(String role) {
        String normalized = role == null
                ? ""
                : role.trim().toLowerCase(Locale.ROOT).replace('_', '-');

        return switch (normalized) {
            case "platform-owner", "admin-master", "master", "dono", "donos", "owner" -> PLATFORM_OWNER;
            case "establishment-owner", "admin-dono", "owner-admin", "dono-estabelecimento", "diretor" ->
                    ESTABLISHMENT_OWNER;
            case "admin", "servidor" -> ADMIN;
            default -> CITIZEN;
        };
    }

    public static boolean isPlatformOwner(String role) {
        return PLATFORM_OWNER.equals(normalize(role));
    }

    public static boolean isAdministrative(String role) {
        return ADMINISTRATIVE_ROLES.contains(normalize(role));
    }
}
