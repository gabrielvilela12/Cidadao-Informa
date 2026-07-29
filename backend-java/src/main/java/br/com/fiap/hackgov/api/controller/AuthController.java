package br.com.fiap.hackgov.api.controller;

import br.com.fiap.hackgov.api.response.ErrorResponse;
import br.com.fiap.hackgov.application.dto.auth.LoginInputDto;
import br.com.fiap.hackgov.application.dto.auth.PhoneUpdateInputDto;
import br.com.fiap.hackgov.application.dto.auth.RegisterInputDto;
import br.com.fiap.hackgov.application.usecase.auth.GetMeUseCase;
import br.com.fiap.hackgov.application.usecase.auth.LoginUseCase;
import br.com.fiap.hackgov.application.usecase.auth.RegisterUseCase;
import br.com.fiap.hackgov.infrastructure.security.AuthenticatedUser;
import br.com.fiap.hackgov.domain.entity.User;
import br.com.fiap.hackgov.domain.repository.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final LoginUseCase loginUseCase;
    private final RegisterUseCase registerUseCase;
    private final GetMeUseCase getMeUseCase;
    private final UserRepository userRepository;

    public AuthController(
            LoginUseCase loginUseCase,
            RegisterUseCase registerUseCase,
            GetMeUseCase getMeUseCase,
            UserRepository userRepository
    ) {
        this.loginUseCase = loginUseCase;
        this.registerUseCase = registerUseCase;
        this.getMeUseCase = getMeUseCase;
        this.userRepository = userRepository;
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginInputDto input) {
        try {
            return ResponseEntity.ok(loginUseCase.execute(input));
        } catch (Exception ex) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(new ErrorResponse(ex.getMessage()));
        }
    }

    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody RegisterInputDto input) {
        try {
            return ResponseEntity.ok(registerUseCase.execute(input));
        } catch (Exception ex) {
            return ResponseEntity.badRequest()
                    .body(new ErrorResponse(ex.getMessage()));
        }
    }

    @GetMapping("/me")
    public ResponseEntity<?> getMe(Authentication authentication) {
        try {
            if (authentication == null || !(authentication.getPrincipal() instanceof AuthenticatedUser principal)) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(new ErrorResponse("Token JWT inválido ou sem identificação do usuário."));
            }

            return ResponseEntity.ok(getMeUseCase.execute(principal.userId()));
        } catch (Exception ex) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(new ErrorResponse(ex.getMessage()));
        }
    }

    @PatchMapping("/me/phone")
    public ResponseEntity<?> updatePhone(
            @RequestBody PhoneUpdateInputDto input,
            Authentication authentication
    ) {
        try {
            if (authentication == null || !(authentication.getPrincipal() instanceof AuthenticatedUser principal)) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(new ErrorResponse("Token JWT inválido."));
            }

            String phone = input.phone() == null ? "" : input.phone().replaceAll("\\D", "");
            if (phone.length() < 10 || phone.length() > 11) {
                return ResponseEntity.badRequest()
                        .body(new ErrorResponse("Telefone deve ter 10 ou 11 dígitos."));
            }

            User user = userRepository.getById(principal.userId())
                    .orElseThrow(() -> new IllegalArgumentException("Usuário não encontrado."));
            user.setPhone(phone);
            userRepository.update(user);
            return ResponseEntity.ok(getMeUseCase.execute(user.getId()));
        } catch (Exception ex) {
            return ResponseEntity.badRequest()
                    .body(new ErrorResponse(ex.getMessage()));
        }
    }
}
