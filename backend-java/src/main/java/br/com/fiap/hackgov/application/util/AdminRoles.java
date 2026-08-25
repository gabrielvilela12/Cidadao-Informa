package br.com.fiap.hackgov.application.util;

public final class AdminRoles {
    public static final String ADMIN = "admin";
    public static final String MASTER = "master";

    private AdminRoles() { }

    public static boolean isAdministrative(String role) {
        return ADMIN.equalsIgnoreCase(role) || MASTER.equalsIgnoreCase(role);
    }

    public static boolean isMaster(String role) {
        return MASTER.equalsIgnoreCase(role);
    }
}
