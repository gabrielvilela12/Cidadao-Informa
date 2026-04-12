package br.com.fiap.hackgov.application.util;

import javax.crypto.SecretKeyFactory;
import javax.crypto.spec.PBEKeySpec;
import java.security.GeneralSecurityException;
import java.security.MessageDigest;
import java.security.SecureRandom;
import java.util.Arrays;
import java.util.Base64;

public final class AuthUtils {

    private static final int PBKDF2_ITERATION_COUNT = 10_000;
    private static final int PBKDF2_SUBKEY_LENGTH = 256;
    private static final int SALT_SIZE = 16;

    private AuthUtils() {
    }

    public static String hashPassword(String password) {
        byte[] salt = new byte[SALT_SIZE];
        new SecureRandom().nextBytes(salt);

        byte[] hash = deriveKey(password, salt);
        byte[] hashBytes = new byte[SALT_SIZE + hash.length];

        System.arraycopy(salt, 0, hashBytes, 0, SALT_SIZE);
        System.arraycopy(hash, 0, hashBytes, SALT_SIZE, hash.length);

        return Base64.getEncoder().encodeToString(hashBytes);
    }

    public static boolean verifyPassword(String password, String hashedPassword) {
        try {
            byte[] hashBytes = Base64.getDecoder().decode(hashedPassword);
            if (hashBytes.length != SALT_SIZE + (PBKDF2_SUBKEY_LENGTH / Byte.SIZE)) {
                return false;
            }

            byte[] salt = Arrays.copyOfRange(hashBytes, 0, SALT_SIZE);
            byte[] expectedHash = Arrays.copyOfRange(hashBytes, SALT_SIZE, hashBytes.length);
            byte[] actualHash = deriveKey(password, salt);

            return MessageDigest.isEqual(expectedHash, actualHash);
        } catch (IllegalArgumentException ex) {
            return false;
        }
    }

    private static byte[] deriveKey(String password, byte[] salt) {
        try {
            PBEKeySpec spec = new PBEKeySpec(
                    password.toCharArray(),
                    salt,
                    PBKDF2_ITERATION_COUNT,
                    PBKDF2_SUBKEY_LENGTH
            );

            SecretKeyFactory factory = SecretKeyFactory.getInstance("PBKDF2WithHmacSHA256");
            return factory.generateSecret(spec).getEncoded();
        } catch (GeneralSecurityException ex) {
            throw new IllegalStateException("Falha ao processar hash de senha.", ex);
        }
    }
}
