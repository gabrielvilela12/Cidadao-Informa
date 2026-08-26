package br.com.fiap.hackgov.application.service;

import br.com.fiap.hackgov.application.dto.protocol.LocationReportOutputDto;
import br.com.fiap.hackgov.application.dto.protocol.ProtocolOutputDto;
import br.com.fiap.hackgov.application.dto.protocol.ProtocolSummaryOutputDto;
import br.com.fiap.hackgov.domain.entity.Protocol;
import br.com.fiap.hackgov.domain.repository.ProtocolRepository;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Locale;
import java.util.Objects;
import java.util.Set;

@Service
public class ProtocolLocationGroupService {

    public static final int GROUP_THRESHOLD = 2;
    public static final int ALERT_THRESHOLD = 10;

    private final ProtocolRepository repository;

    public ProtocolLocationGroupService(ProtocolRepository repository) {
        this.repository = repository;
    }

    /**
     * Acrescenta os metadados sem remover linhas. A fila administrativa decide
     * como condensar os grupos; mapas e indicadores continuam recebendo todos
     * os relatos e, portanto, nao perdem densidade ou contagem.
     */
    public List<ProtocolSummaryOutputDto> summarizeForAdmin(List<Protocol> protocols) {
        Map<String, List<Protocol>> groups = new LinkedHashMap<>();
        for (Protocol protocol : protocols) {
            String key = hasText(protocol.getLocationKey()) && hasText(protocol.getCauseKey())
                    ? protocol.getLocationKey() + "\u0000" + protocol.getCauseKey()
                    : "protocol:" + protocol.getId();
            groups.computeIfAbsent(key, ignored -> new ArrayList<>()).add(protocol);
        }

        Map<String, GroupMetadata> metadataByProtocol = new LinkedHashMap<>();
        for (List<Protocol> members : groups.values()) {
            GroupMetadata metadata = metadata(members);
            for (Protocol member : members) metadataByProtocol.put(member.getId(), metadata);
        }

        return protocols.stream().map(protocol -> {
            GroupMetadata metadata = metadataByProtocol.get(protocol.getId());
            return ProtocolSummaryOutputDto.from(
                    protocol,
                    metadata.count(),
                    metadata.grouped(),
                    metadata.alert(),
                    metadata.primaryProtocolId()
            );
        }).toList();
    }

    /** DTO completo com a relacao das pessoas, usado somente no detalhe administrativo. */
    public ProtocolOutputDto detailsForAdmin(Protocol protocol, Set<String> allowedStates) {
        List<Protocol> members = findMembers(protocol).stream()
                .filter(member -> member.getStateCode() != null
                        && allowedStates.contains(member.getStateCode().toUpperCase(Locale.ROOT)))
                .toList();
        if (members.isEmpty()) members = List.of(protocol);
        GroupMetadata metadata = metadata(members);
        List<LocationReportOutputDto> reports = metadata.grouped()
                ? members.stream().map(LocationReportOutputDto::from).toList()
                : List.of();
        return ProtocolOutputDto.from(
                protocol,
                metadata.count(),
                metadata.grouped(),
                metadata.alert(),
                metadata.primaryProtocolId(),
                reports
        );
    }

    public ProtocolOutputDto detailsForEstablishmentAdmin(Protocol protocol, String establishmentId) {
        List<Protocol> members = findMembers(protocol).stream()
                .filter(member -> Objects.equals(establishmentId, member.getEstablishmentId()))
                .toList();
        if (members.isEmpty()) members = List.of(protocol);
        GroupMetadata metadata = metadata(members);
        List<LocationReportOutputDto> reports = metadata.grouped()
                ? members.stream().map(LocationReportOutputDto::from).toList()
                : List.of();
        return ProtocolOutputDto.from(
                protocol,
                metadata.count(),
                metadata.grouped(),
                metadata.alert(),
                metadata.primaryProtocolId(),
                reports
        );
    }

    /** A sincronizacao passa a valer assim que o segundo relato existe. */
    public List<Protocol> membersForStatusSync(Protocol protocol) {
        List<Protocol> members = findMembers(protocol);
        return members.size() >= GROUP_THRESHOLD ? members : List.of(protocol);
    }

    private List<Protocol> findMembers(Protocol protocol) {
        if (!hasText(protocol.getLocationKey()) || !hasText(protocol.getCauseKey())) return List.of(protocol);
        List<Protocol> found = repository.getByLocationAndCause(
                protocol.getLocationKey(),
                protocol.getCauseKey()
        );
        if (found == null || found.isEmpty()) return List.of(protocol);
        return found.stream()
                .sorted(Comparator.comparing(Protocol::getCreatedAt).thenComparing(Protocol::getId))
                .toList();
    }

    private GroupMetadata metadata(List<Protocol> members) {
        List<Protocol> ordered = members.stream()
                .sorted(Comparator.comparing(Protocol::getCreatedAt).thenComparing(Protocol::getId))
                .toList();
        int count = ordered.size();
        return new GroupMetadata(
                count,
                count >= GROUP_THRESHOLD,
                count > ALERT_THRESHOLD,
                ordered.getFirst().getId()
        );
    }

    private boolean hasText(String value) {
        return value != null && !value.isBlank();
    }

    private record GroupMetadata(int count, boolean grouped, boolean alert, String primaryProtocolId) {
    }
}
