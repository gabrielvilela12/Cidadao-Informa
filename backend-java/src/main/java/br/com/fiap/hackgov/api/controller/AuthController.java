package br.com.fiap.hackgov.api.controller;

import br.com.fiap.hackgov.api.response.ErrorResponse;
import br.com.fiap.hackgov.application.dto.auth.LoginInputDto;
import br.com.fiap.hackgov.application.dto.auth.PhoneUpdateInputDto;
import br.com.fiap.hackgov.application.dto.auth.RegisterInputDto;
import br.com.fiap.hackgov.application.usecase.auth.GetMeUseCase;
import br.com.fiap.hackgov.application.usecase.auth.LoginUseCase;
import br.com.fiap.hackgov.application.usecase.auth.RegisterUseCase;
import br.com.fiap.hackgov.domain.entity.User;
import br.com.fiap.hackgov.domain.repository.UserRepository;
import br.com.fiap.hackgov.infrastructure.security.AuthenticatedUser;
import br.com.fiap.hackgov.infrastructure.security.LoginRateLimiter;
import jakarta.servlet.http.HttpServletRequest;
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
    private final LoginRateLimiter loginRateLimiter;

    public AuthController(
            LoginUseCase loginUseCase,
            RegisterUseCase registerUseCase,
            GetMeUseCase getMeUseCase,
            UserRepository userRepository,
            LoginRateLimiter loginRateLimiter
    ) {
        this.loginUseCase = loginUseCase;
        this.registerUseCase = registerUseCase;
        this.getMeUseCase = getMeUseCase;
        this.userRepository = userRepository;
        this.loginRateLimiter = loginRateLimiter;
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(
            @RequestBody LoginInputDto input,
            HttpServletRequest request
    ) {
        LoginRateLimiter.RateLimitDecision decision = loginRateLimiter.check(request, input);
        if (!decision.allowed()) {
            return ResponseEntity.status(HttpStatus.TOO_MANY_REQUESTS)
                    .header("Retry-After", String.valueOf(decision.retryAfterSeconds()))
                    .body(new ErrorResponse("Muitas tentativas de login. Aguarde alguns minutos e tente novamente."));
        }

        try {
            var output = loginUseCase.execute(input);
            loginRateLimiter.recordSuccess(request, input);
            return ResponseEntity.ok(output);
        } catch (Exception ex) {
            loginRateLimiter.recordFailure(request, input);
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
                        .body(new ErrorResponse("Token JWT invalido ou sem identificacao do usuario."));
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
                        .body(new ErrorResponse("Token JWT invalido."));
            }

            String phone = input.phone() == null ? "" : input.phone().replaceAll("\\D", "");
            if (phone.length() < 10 || phone.length() > 11) {
                return ResponseEntity.badRequest()
                        .body(new ErrorResponse("Telefone deve ter 10 ou 11 digitos."));
            }

            User user = userRepository.getById(principal.userId())
                    .orElseThrow(() -> new IllegalArgumentException("Usuario nao encontrado."));
            user.setPhone(phone);
            userRepository.update(user);
            return ResponseEntity.ok(getMeUseCase.execute(user.getId()));
        } catch (Exception ex) {
            return ResponseEntity.badRequest()
                    .body(new ErrorResponse(ex.getMessage()));
        }
    }
}