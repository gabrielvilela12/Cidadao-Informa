package br.com.fiap.hackgov.domain.repository;

import br.com.fiap.hackgov.domain.entity.Protocol;

import java.util.List;
import java.util.Optional;

public interface ProtocolRepository {

    Protocol add(Protocol protocol);

    Optional<Protocol> getById(String id);

    List<Protocol> getAll();

    List<Protocol> getByUserId(String userId);

    Protocol update(Protocol protocol);
}
