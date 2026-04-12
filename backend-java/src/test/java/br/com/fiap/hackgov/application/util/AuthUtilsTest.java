package br.com.fiap.hackgov.application.util;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

class AuthUtilsTest {

    @Test
    void shouldHashAndVerifyPasswordUsingDotNetCompatibleLayout() {
        String rawPassword = "Senha@123";
        String hashedPassword = AuthUtils.hashPassword(rawPassword);

        assertNotEquals(rawPassword, hashedPassword);
        assertTrue(AuthUtils.verifyPassword(rawPassword, hashedPassword));
        assertFalse(AuthUtils.verifyPassword("senha-invalida", hashedPassword));
    }

    @Test
    void shouldReturnFalseForInvalidHashInput() {
        assertFalse(AuthUtils.verifyPassword("qualquer", "hash-invalido"));
    }
}
