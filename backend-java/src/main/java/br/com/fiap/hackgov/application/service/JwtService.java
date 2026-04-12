package br.com.fiap.hackgov.application.service;

import br.com.fiap.hackgov.domain.entity.User;
import br.com.fiap.hackgov.infrastructure.security.AuthenticatedUser;

import java.util.Optional;

public interface JwtService {

    String generateToken(User user);

    Optional<AuthenticatedUser> parseToken(String token);
}
