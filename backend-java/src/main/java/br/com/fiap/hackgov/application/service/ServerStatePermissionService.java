package br.com.fiap.hackgov.application.service;

import br.com.fiap.hackgov.application.dto.admin.ServerPermissionOutputDto;
import br.com.fiap.hackgov.domain.entity.Protocol;
import br.com.fiap.hackgov.domain.entity.ServerStatePermission;
import br.com.fiap.hackgov.domain.entity.User;
import br.com.fiap.hackgov.domain.repository.UserRepository;
import br.com.fiap.hackgov.application.util.AdminRoles;
import br.com.fiap.hackgov.infrastructure.repository.ServerStatePermissionRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.text.Normalizer;
import java.util.HashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Service
public class ServerStatePermissionService {
    public static final List<String> ALL_STATES = List.of(
            "AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO",
            "MA", "MT", "MS", "MG", "PA", "PB", "PR", "PE", "PI",
            "RJ", "RN", "RS", "RO", "RR", "SC", "SP", "SE", "TO"
    );
    private static final Set<String> VALID_STATES = Set.copyOf(ALL_STATES);
    private static final Map<String, String> STATE_NAMES = Map.ofEntries(
            Map.entry("ACRE", "AC"), Map.entry("ALAGOAS", "AL"), Map.entry("AMAPA", "AP"),
            Map.entry("AMAZONAS", "AM"), Map.entry("BAHIA", "BA"), Map.entry("CEARA", "CE"),
            Map.entry("DISTRITO FEDERAL", "DF"), Map.entry("ESPIRITO SANTO", "ES"),
            Map.entry("GOIAS", "GO"), Map.entry("MARANHAO", "MA"), Map.entry("MATO GROSSO", "MT"),
            Map.entry("MATO GROSSO DO SUL", "MS"), Map.entry("MINAS GERAIS", "MG"),
            Map.entry("PARA", "PA"), Map.entry("PARAIBA", "PB"), Map.entry("PARANA", "PR"),
            Map.entry("PERNAMBUCO", "PE"), Map.entry("PIAUI", "PI"),
            Map.entry("RIO DE JANEIRO", "RJ"), Map.entry("RIO GRANDE DO NORTE", "RN"),
            Map.entry("RIO GRANDE DO SUL", "RS"), Map.entry("RONDONIA", "RO"),
            Map.entry("RORAIMA", "RR"), Map.entry("SANTA CATARINA", "SC"),
            Map.entry("SAO PAULO", "SP"), Map.entry("SERGIPE", "SE"), Map.entry("TOCANTINS", "TO")
    );
    private static final Pattern ADDRESS_STATE = Pattern.compile(
            "(?:^|[-,/\\s])(" + String.join("|", ALL_STATES) + ")\\s*$",
            Pattern.CASE_INSENSITIVE
    );

    private final ServerStatePermissionRepository permissionRepository;
    private final UserRepository userRepository;

    public ServerStatePermissionService(ServerStatePermissionRepository permissionRepository,
                                        UserRepository userRepository) {
        this.permissionRepository = permissionRepository;
        this.userRepository = userRepository;
    }

    @Transactional(readOnly = true)
    public List<ServerPermissionOutputDto> listServers() {
        Map<String, List<String>> statesByUser = new HashMap<>();
        permissionRepository.findAllByOrderByStateCodeAsc().forEach(permission ->
                statesByUser.computeIfAbsent(permission.getUserId(), ignored -> new java.util.ArrayList<>())
                        .add(permission.getStateCode()));

        return java.util.stream.Stream.concat(
                        userRepository.getByRole(AdminRoles.ADMIN).stream(),
                        userRepository.getByRole(AdminRoles.MASTER).stream())
                .map(user -> new ServerPermissionOutputDto(
                        user.getId(), user.getName(), user.getEmail(), user.getCreatedAt(),
                        List.copyOf(statesByUser.getOrDefault(user.getId(), List.of()))
                ))
                .toList();
    }

    @Transactional
    public ServerPermissionOutputDto update(String userId, List<String> requestedStates) {
        User server = userRepository.getById(userId)
                .filter(user -> AdminRoles.isAdministrative(user.getRole()))
                .orElseThrow(() -> new IllegalArgumentException("Servidor não encontrado."));

        LinkedHashSet<String> states = new LinkedHashSet<>();
        if (requestedStates != null) {
            requestedStates.forEach(value -> {
                String state = normalizeState(value);
                if (!VALID_STATES.contains(state)) {
                    throw new IllegalArgumentException("UF inválida: " + value);
                }
                states.add(state);
            });
        }

        permissionRepository.deleteByUserId(userId);
        permissionRepository.flush();
        states.stream().map(state -> {
            ServerStatePermission permission = new ServerStatePermission();
            permission.setUserId(userId);
            permission.setStateCode(state);
            return permission;
        }).forEach(permissionRepository::save);

        return new ServerPermissionOutputDto(
                server.getId(), server.getName(), server.getEmail(), server.getCreatedAt(), List.copyOf(states)
        );
    }

    @Transactional(readOnly = true)
    public Set<String> allowedStates(String userId) {
        if (userRepository.getById(userId).map(User::getRole).filter(AdminRoles::isMaster).isPresent()) {
            return Set.copyOf(ALL_STATES);
        }
        return permissionRepository.findByUserIdOrderByStateCodeAsc(userId).stream()
                .map(ServerStatePermission::getStateCode)
                .collect(java.util.stream.Collectors.toUnmodifiableSet());
    }

    public boolean canAccess(Protocol protocol, Set<String> allowedStates) {
        return protocol != null && protocol.getStateCode() != null
                && allowedStates.contains(protocol.getStateCode().toUpperCase(Locale.ROOT));
    }

    public void requireAccess(Protocol protocol, String userId) {
        if (!canAccess(protocol, allowedStates(userId))) {
            throw new IllegalArgumentException("Você não tem permissão para acessar protocolos desta UF.");
        }
    }

    public String resolveState(String explicitState, String address) {
        if (explicitState != null && !explicitState.isBlank()) {
            String normalized = normalizeState(explicitState);
            if (!VALID_STATES.contains(normalized)) {
                throw new IllegalArgumentException("Informe uma UF válida para o protocolo.");
            }
            return normalized;
        }
        if (address != null) {
            Matcher matcher = ADDRESS_STATE.matcher(stripAccents(address));
            if (matcher.find()) return matcher.group(1).toUpperCase(Locale.ROOT);
            String normalizedAddress = stripAccents(address).trim().toUpperCase(Locale.ROOT);
            for (Map.Entry<String, String> state : STATE_NAMES.entrySet()) {
                if (normalizedAddress.endsWith(state.getKey())) return state.getValue();
            }
        }
        throw new IllegalArgumentException("Não foi possível identificar a UF do endereço.");
    }

    private String normalizeState(String value) {
        String normalized = value == null ? "" : stripAccents(value).trim().toUpperCase(Locale.ROOT);
        return STATE_NAMES.getOrDefault(normalized, normalized);
    }

    private String stripAccents(String value) {
        return Normalizer.normalize(value, Normalizer.Form.NFD).replaceAll("\\p{M}", "");
    }
}
