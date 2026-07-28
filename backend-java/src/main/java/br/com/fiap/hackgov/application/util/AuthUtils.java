package br.com.fiap.hackgov.application.util;

import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

public final class AuthUtils {

    private static final BCryptPasswordEncoder PASSWORD_ENCODER =
            new BCryptPasswordEncoder(10);

    private AuthUtils() {
    }

    public static String hashPassword(String password) {
        return PASSWORD_ENCODER.encode(password);
    }

    public static boolean verifyPassword(String password, String hashedPassword) {
        try {
            return hashedPassword != null
                    && PASSWORD_ENCODER.matches(password, hashedPassword);
        } catch (IllegalArgumentException exception) {
            return false;
        }
    }
}
