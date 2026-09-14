package br.com.fiap.hackgov.infrastructure.service;

import br.com.fiap.hackgov.application.service.JwtService;
import br.com.fiap.hackgov.domain.entity.User;
import br.com.fiap.hackgov.domain.repository.UserRepository;
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
import java.util.Objects;

@Service
public class JwtServiceImpl implements JwtService {

    private static final String CLAIM_NAME_IDENTIFIER =
            "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier";
    private static final String CLAIM_NAME =
            "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name";
    private static final String CLAIM_ROLE =
            "http://schemas.microsoft.com/ws/2008/06/identity/claims/role";
    private static final String CLAIM_CPF = "Cpf";
    private static final String CLAIM_ESTABLISHMENT_ID = "establishment_id";

    private final SecretKey signingKey;
    private final UserRepository userRepository;

    public JwtServiceImpl(@Value("${app.jwt.secret}") String secret, UserRepository userRepository) {
        this.signingKey = Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
        this.userRepository = userRepository;
    }

    @Override
    public String generateToken(User user) {
        Instant now = Instant.now();

        return Jwts.builder()
                .claim(CLAIM_NAME_IDENTIFIER, user.getId())
                .claim(CLAIM_NAME, user.getName())
                .claim(CLAIM_CPF, user.getCpf())
                .claim(CLAIM_ROLE, user.getRole())
                .claim(CLAIM_ESTABLISHMENT_ID, user.getEstablishmentId())
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

            return userRepository.getById(userId)
                    .filter(user -> "active".equalsIgnoreCase(user.getStatus()))
                    .filter(user -> Objects.equals(user.getRole(), claims.get(CLAIM_ROLE, String.class)))
                    .filter(user -> Objects.equals(user.getEstablishmentId(),
                            claims.get(CLAIM_ESTABLISHMENT_ID, String.class)))
                    .map(user -> new AuthenticatedUser(
                            user.getId(), user.getName(), user.getCpf(),
                            user.getRole(), user.getEstablishmentId()
                    ));
        } catch (JwtException | IllegalArgumentException ex) {
            return Optional.empty();
        }
    }
}
