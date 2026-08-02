package br.com.fiap.hackgov.domain.repository;

import br.com.fiap.hackgov.domain.entity.User;

import java.util.Optional;

public interface UserRepository {

    Optional<User> getByCpf(String cpf);

    Optional<User> getByEmail(String email);

    Optional<User> getById(String id);

    long countByRole(String role);

    User add(User user);

    User update(User user);
}
