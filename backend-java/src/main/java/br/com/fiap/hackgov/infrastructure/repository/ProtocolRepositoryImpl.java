package br.com.fiap.hackgov.infrastructure.repository;

import br.com.fiap.hackgov.domain.entity.Protocol;
import br.com.fiap.hackgov.domain.repository.ProtocolRepository;
import br.com.fiap.hackgov.infrastructure.persistence.repository.JpaProtocolRepository;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.Set;

@Repository
public class ProtocolRepositoryImpl implements ProtocolRepository {

    private final JpaProtocolRepository repository;

    public ProtocolRepositoryImpl(JpaProtocolRepository repository) {
        this.repository = repository;
    }

    @Override
    public Protocol add(Protocol protocol) {
        return repository.save(protocol);
    }

    @Override
    public Optional<Protocol> getById(String id) {
        return repository.findById(id);
    }

    @Override
    public List<Protocol> getAll() {
        return repository.findAllByOrderByCreatedAtDesc();
    }

    @Override
    public List<Protocol> getByStates(Set<String> states) {
        return states.isEmpty() ? List.of() : repository.findByStateCodeInOrderByCreatedAtDesc(states);
    }

    @Override
    public List<Protocol> getByUserId(String userId) {
        return repository.findByUserIdOrderByCreatedAtDesc(userId);
    }

    @Override
    public List<Protocol> getByUserIdAndStates(String userId, Set<String> states) {
        return states.isEmpty() ? List.of() : repository.findByUserIdAndStateCodeInOrderByCreatedAtDesc(userId, states);
    }

    @Override
    public List<Protocol> getByLocationAndCause(String locationKey, String causeKey) {
        return locationKey == null || locationKey.isBlank() || causeKey == null || causeKey.isBlank()
                ? List.of()
                : repository.findByLocationKeyAndCauseKeyOrderByCreatedAtAsc(locationKey, causeKey);
    }

    @Override
    public List<Protocol> getByEstablishmentId(String establishmentId) {
        return repository.findByEstablishmentIdOrderByCreatedAtDesc(establishmentId);
    }

    @Override
    public long countAll() {
        return repository.count();
    }

    @Override
    public long countByStatuses(List<String> statuses) {
        return repository.countByStatusIn(statuses);
    }

    @Override
    public List<CitizenProtocolStats> getCitizenStats() {
        return repository.findCitizenProtocolStats().stream()
                .map(item -> new CitizenProtocolStats(
                        item.getUserId(),
                        item.getProtocolCount(),
                        item.getOpenProtocolCount(),
                        item.getLastProtocolAt()
                ))
                .toList();
    }

    @Override
    public List<CitizenProtocolStats> getCitizenStatsByStates(Set<String> states) {
        if (states.isEmpty()) return List.of();
        return repository.findCitizenProtocolStatsByStateCodeIn(states).stream()
                .map(item -> new CitizenProtocolStats(
                        item.getUserId(), item.getProtocolCount(), item.getOpenProtocolCount(), item.getLastProtocolAt()
                ))
                .toList();
    }

    @Override
    public List<TransparencyProtocol> getTransparencyData() {
        return repository.findAllProjectedByOrderByCreatedAtDesc().stream()
                .map(item -> new TransparencyProtocol(
                        item.getId(),
                        item.getCategory(),
                        item.getAddress(),
                        item.getCreatedAt(),
                        item.getStatus(),
                        item.getResolutionCost(),
                        item.getAiPriority(),
                        item.getAiStatus(),
                        item.getLatitude(),
                        item.getLongitude()
                ))
                .toList();
    }

    @Override
    public List<Protocol> getWithoutCoordinates(int limit) {
        return repository.findByLatitudeIsNullOrderByCreatedAtDesc(PageRequest.of(0, limit));
    }

    @Override
    public long countWithoutCoordinates() {
        return repository.countByLatitudeIsNull();
    }

    @Override
    public Protocol update(Protocol protocol) {
        return repository.save(protocol);
    }
}
