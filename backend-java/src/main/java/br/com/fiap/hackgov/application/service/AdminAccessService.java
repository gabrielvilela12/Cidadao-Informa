package br.com.fiap.hackgov.application.service;

import br.com.fiap.hackgov.application.dto.admin.AdminAccessProfileOutputDto;
import br.com.fiap.hackgov.application.dto.admin.AdminUserAccessOutputDto;
import br.com.fiap.hackgov.application.util.AuthUtils;
import br.com.fiap.hackgov.domain.entity.ServerScreenPermission;
import br.com.fiap.hackgov.domain.entity.User;
import br.com.fiap.hackgov.domain.repository.UserRepository;
import br.com.fiap.hackgov.infrastructure.repository.ServerScreenPermissionRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ResponseStatus;

import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Set;

@Service
public class AdminAccessService {
    public static final String CITIZENS = "CITIZENS";
    public static final String USER_MANAGEMENT = "USER_MANAGEMENT";
    public static final String REPORTS = "REPORTS";
    public static final String AI = "AI";
    public static final Set<String> OPTIONAL_SCREENS = Set.of(CITIZENS, USER_MANAGEMENT, REPORTS, AI);
    public static final List<String> MANDATORY_SCREENS = List.of(
            "DASHBOARD", "REQUESTS", "MAP", "ACCESSIBILITY"
    );

    private final ServerScreenPermissionRepository screenRepository;
    private final ServerStatePermissionService statePermissionService;
    private final UserRepository userRepository;

    public AdminAccessService(ServerScreenPermissionRepository screenRepository,
                              ServerStatePermissionService statePermissionService,
                              UserRepository userRepository) {
        this.screenRepository = screenRepository;
        this.statePermissionService = statePermissionService;
        this.userRepository = userRepository;
    }

    @Transactional(readOnly = true)
    public AdminAccessProfileOutputDto profile(String userId) {
        List<String> screens = new ArrayList<>(MANDATORY_SCREENS);
        screens.addAll(screenPermissions(userId).stream().sorted().toList());
        return new AdminAccessProfileOutputDto(
                statePermissionService.allowedStates(userId).stream().sorted().toList(),
                List.copyOf(screens)
        );
    }

    @Transactional(readOnly = true)
    public List<AdminUserAccessOutputDto> listManageable(String actorUserId) {
        requireScreen(actorUserId, USER_MANAGEMENT);
        Set<String> actorStates = statePermissionService.allowedStates(actorUserId);
        Set<String> actorScreens = screenPermissions(actorUserId);

        return userRepository.getByRole("admin").stream()
                .map(user -> toOutput(user,
                        statePermissionService.allowedStates(user.getId()),
                        screenPermissions(user.getId())))
                .filter(user -> actorStates.containsAll(user.states()) && actorScreens.containsAll(user.screens()))
                .toList();
    }

    @Transactional
    public AdminUserAccessOutputDto create(String actorUserId,
                                           String name,
                                           String email,
                                           String cpf,
                                           String password,
                                           List<String> requestedStates,
                                           List<String> requestedScreens) {
        Delegation delegation = validateDelegation(actorUserId, requestedStates, requestedScreens);
        validateNewAdmin(name, email, cpf, password, delegation.states());
        String normalizedEmail = email.trim().toLowerCase(Locale.ROOT);
        String normalizedCpf = cpf.replaceAll("\\D", "");

        if (userRepository.getByCpf(normalizedCpf).isPresent()) {
            throw new IllegalArgumentException("Já existe uma conta cadastrada com este CPF.");
        }
        if (userRepository.getByEmail(normalizedEmail).isPresent()) {
            throw new IllegalArgumentException("Já existe uma conta cadastrada com este e-mail.");
        }

        User user = new User();
        user.setName(name.trim());
        user.setEmail(normalizedEmail);
        user.setCpf(normalizedCpf);
        user.setPasswordHash(AuthUtils.hashPassword(password));
        user.setRole("admin");
        User created = userRepository.add(user);

        statePermissionService.update(created.getId(), delegation.states().stream().toList());
        replaceScreens(created.getId(), delegation.screens());
        return toOutput(created, delegation.states(), delegation.screens());
    }

    @Transactional
    public AdminUserAccessOutputDto update(String actorUserId,
                                           String targetUserId,
                                           List<String> requestedStates,
                                           List<String> requestedScreens) {
        requireScreen(actorUserId, USER_MANAGEMENT);
        User target = requireAdminUser(targetUserId);
        Set<String> actorStates = statePermissionService.allowedStates(actorUserId);
        Set<String> actorScreens = screenPermissions(actorUserId);
        Set<String> currentTargetStates = statePermissionService.allowedStates(targetUserId);
        Set<String> currentTargetScreens = screenPermissions(targetUserId);

        if (!actorStates.containsAll(currentTargetStates) || !actorScreens.containsAll(currentTargetScreens)) {
            throw new AdminAccessDeniedException("Você não pode alterar um administrador com permissões superiores às suas.");
        }

        Delegation delegation = normalizeDelegation(requestedStates, requestedScreens);
        requireSubset(actorStates, actorScreens, delegation);
        statePermissionService.update(targetUserId, delegation.states().stream().toList());
        replaceScreens(targetUserId, delegation.screens());
        return toOutput(target, delegation.states(), delegation.screens());
    }

    @Transactional(readOnly = true)
    public boolean hasScreen(String userId, String screen) {
        String normalized = normalizeScreen(screen);
        return MANDATORY_SCREENS.contains(normalized) || screenPermissions(userId).contains(normalized);
    }

    @Transactional(readOnly = true)
    public void requireScreen(String userId, String screen) {
        if (!hasScreen(userId, screen)) {
            throw new AdminAccessDeniedException("Você não tem permissão para acessar esta tela.");
        }
    }

    @Transactional(readOnly = true)
    public Set<String> screenPermissions(String userId) {
        return screenRepository.findByUserIdOrderByScreenKeyAsc(userId).stream()
                .map(ServerScreenPermission::getScreenKey)
                .collect(java.util.stream.Collectors.toUnmodifiableSet());
    }

    private Delegation validateDelegation(String actorUserId,
                                          List<String> requestedStates,
                                          List<String> requestedScreens) {
        requireScreen(actorUserId, USER_MANAGEMENT);
        Delegation delegation = normalizeDelegation(requestedStates, requestedScreens);
        requireSubset(
                statePermissionService.allowedStates(actorUserId),
                screenPermissions(actorUserId),
                delegation
        );
        return delegation;
    }

    private void requireSubset(Set<String> actorStates,
                               Set<String> actorScreens,
                               Delegation delegation) {
        if (!actorStates.containsAll(delegation.states())) {
            throw new AdminAccessDeniedException("Você só pode delegar estados aos quais também possui acesso.");
        }
        if (!actorScreens.containsAll(delegation.screens())) {
            throw new AdminAccessDeniedException("Você só pode delegar telas às quais também possui acesso.");
        }
    }

    private Delegation normalizeDelegation(List<String> requestedStates, List<String> requestedScreens) {
        LinkedHashSet<String> states = new LinkedHashSet<>();
        if (requestedStates != null) {
            requestedStates.forEach(value -> {
                String state = value == null ? "" : value.trim().toUpperCase(Locale.ROOT);
                if (!ServerStatePermissionService.ALL_STATES.contains(state)) {
                    throw new IllegalArgumentException("UF inválida: " + value);
                }
                states.add(state);
            });
        }

        LinkedHashSet<String> screens = new LinkedHashSet<>();
        if (requestedScreens != null) {
            requestedScreens.forEach(value -> {
                String screen = normalizeScreen(value);
                if (!OPTIONAL_SCREENS.contains(screen)) {
                    throw new IllegalArgumentException("Permissão de tela inválida: " + value);
                }
                screens.add(screen);
            });
        }
        return new Delegation(Set.copyOf(states), Set.copyOf(screens));
    }

    private String normalizeScreen(String value) {
        return value == null ? "" : value.trim().toUpperCase(Locale.ROOT);
    }

    private void validateNewAdmin(String name, String email, String cpf, String password, Set<String> states) {
        if (name == null || name.isBlank()) throw new IllegalArgumentException("O nome completo é obrigatório.");
        if (email == null || email.isBlank() || !email.contains("@")) throw new IllegalArgumentException("Informe um e-mail válido.");
        String normalizedCpf = cpf == null ? "" : cpf.replaceAll("\\D", "");
        if (normalizedCpf.length() != 11) throw new IllegalArgumentException("O CPF deve ter exatamente 11 dígitos.");
        if (password == null || password.length() < 6) throw new IllegalArgumentException("A senha deve ter pelo menos 6 caracteres.");
        if (states.isEmpty()) throw new IllegalArgumentException("Selecione ao menos um estado para o novo administrador.");
    }

    private User requireAdminUser(String userId) {
        return userRepository.getById(userId)
                .filter(user -> "admin".equalsIgnoreCase(user.getRole()))
                .orElseThrow(() -> new IllegalArgumentException("Administrador não encontrado."));
    }

    private void replaceScreens(String userId, Set<String> screens) {
        screenRepository.deleteByUserId(userId);
        screenRepository.flush();
        screens.stream().sorted().map(screen -> {
            ServerScreenPermission permission = new ServerScreenPermission();
            permission.setUserId(userId);
            permission.setScreenKey(screen);
            return permission;
        }).forEach(screenRepository::save);
    }

    private AdminUserAccessOutputDto toOutput(User user, Set<String> states, Set<String> screens) {
        return new AdminUserAccessOutputDto(
                user.getId(), user.getName(), user.getEmail(), user.getCreatedAt(),
                states.stream().sorted().toList(), screens.stream().sorted().toList()
        );
    }

    private record Delegation(Set<String> states, Set<String> screens) { }

    @ResponseStatus(HttpStatus.FORBIDDEN)
    public static class AdminAccessDeniedException extends RuntimeException {
        public AdminAccessDeniedException(String message) { super(message); }
    }
}
