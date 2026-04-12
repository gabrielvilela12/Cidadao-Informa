package br.com.fiap.hackgov.infrastructure.service;

import br.com.fiap.hackgov.application.service.JwtService;
import br.com.fiap.hackgov.domain.entity.User;
import br.com.fiap.hackgov.infrastructure.security.AuthenticatedUser;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Date;
import java.util.Optional;

@Service
public class JwtServiceImpl implements JwtService {

    private static final String CLAIM_NAME_IDENTIFIER =
            "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier";
    private static final String CLAIM_NAME =
            "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name";
    private static final String CLAIM_ROLE =
            "http://schemas.microsoft.com/ws/2008/06/identity/claims/role";
    private static final String CLAIM_CPF = "Cpf";

    private final SecretKey signingKey;

    public JwtServiceImpl(@Value("${app.jwt.secret}") String secret) {
        this.signingKey = Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
    }

    @Override
    public String generateToken(User user) {
        Instant now = Instant.now();

        return Jwts.builder()
                .claim(CLAIM_NAME_IDENTIFIER, user.getId())
                .claim(CLAIM_NAME, user.getName())
                .claim(CLAIM_CPF, user.getCpf())
                .claim(CLAIM_ROLE, user.getRole())
                .issuedAt(Date.from(now))
                .expiration(Date.from(now.plus(24, ChronoUnit.HOURS)))
                .signWith(signingKey)
                .compact();
    }

    @Override
    public Optional<AuthenticatedUser> parseToken(String token) {
        try {
            Claims claims = Jwts.parser()
                    .verifyWith(signingKey)
                    .build()
                    .parseSignedClaims(token)
                    .getPayload();

            String userId = claims.get(CLAIM_NAME_IDENTIFIER, String.class);
            if (!StringUtils.hasText(userId)) {
                return Optional.empty();
            }

            return Optional.of(new AuthenticatedUser(
                    userId,
                    claims.get(CLAIM_NAME, String.class),
                    claims.get(CLAIM_CPF, String.class),
                    claims.get(CLAIM_ROLE, String.class)
            ));
        } catch (JwtException | IllegalArgumentException ex) {
            return Optional.empty();
        }
    }
}
