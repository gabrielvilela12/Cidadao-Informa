package br.com.fiap.hackgov.application.util;

import java.util.Locale;

public final class AdminRoles {
    public static final String ADMIN = "admin";
    public static final String MASTER = "master";
    public static final String ESTABLISHMENT_OWNER = "establishment_owner";

    private AdminRoles() { }

    public static boolean isAdministrative(String role) {
        String normalized = normalize(role);
        return ADMIN.equals(normalized)
                || MASTER.equals(normalized)
                || ESTABLISHMENT_OWNER.equals(normalized);
    }

    public static boolean isMaster(String role) {
        return MASTER.equals(normalize(role));
    }

    private static String normalize(String role) {
        String normalized = role == null
                ? ""
                : role.trim().toLowerCase(Locale.ROOT).replace('_', '-');
        return switch (normalized) {
            case "platform-owner", "admin-master", "master", "dono", "donos", "owner" -> MASTER;
            case "establishment-owner", "admin-dono", "owner-admin", "dono-estabelecimento", "diretor" ->
                    ESTABLISHMENT_OWNER;
            case "admin", "servidor" -> ADMIN;
            default -> normalized.replace('-', '_');
        };
    }
}
