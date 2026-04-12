package br.com.fiap.hackgov.domain.repository;

import br.com.fiap.hackgov.domain.entity.User;

import java.util.Optional;

public interface UserRepository {

    Optional<User> getByCpf(String cpf);

    Optional<User> getByEmail(String email);

    Optional<User> getById(String id);

    User add(User user);
}
