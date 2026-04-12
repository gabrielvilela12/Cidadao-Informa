package br.com.fiap.hackgov.infrastructure.repository;

import br.com.fiap.hackgov.domain.entity.User;
import br.com.fiap.hackgov.domain.repository.UserRepository;
import br.com.fiap.hackgov.infrastructure.persistence.repository.JpaUserRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public class UserRepositoryImpl implements UserRepository {

    private final JpaUserRepository repository;

    public UserRepositoryImpl(JpaUserRepository repository) {
        this.repository = repository;
    }

    @Override
    public Optional<User> getByCpf(String cpf) {
        return repository.findByCpf(cpf);
    }

    @Override
    public Optional<User> getByEmail(String email) {
        return repository.findByEmail(email.toLowerCase());
    }

    @Override
    public Optional<User> getById(String id) {
        return repository.findById(id);
    }

    @Override
    public User add(User user) {
        return repository.save(user);
    }
}
