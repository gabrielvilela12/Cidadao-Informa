package br.com.fiap.hackgov.infrastructure.service;

import br.com.fiap.hackgov.domain.entity.User;
import br.com.fiap.hackgov.domain.repository.UserRepository;
import org.junit.jupiter.api.Test;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class JwtServiceImplTest {

    @Test
    void deactivatedOrMovedAccountCannotReuseAnExistingToken() {
        UserRepository users = mock(UserRepository.class);
        User employee = new User();
        employee.setId("employee-1");
        employee.setName("Mariana Costa");
        employee.setCpf("55566677788");
        employee.setRole("admin");
        employee.setStatus("active");
        employee.setEstablishmentId("est-sao-paulo");
        when(users.getById("employee-1")).thenReturn(Optional.of(employee));

        JwtServiceImpl jwt = new JwtServiceImpl(
                "jwt-test-secret-with-at-least-thirty-two-bytes", users);
        String token = jwt.generateToken(employee);
        assertTrue(jwt.parseToken(token).isPresent());

        employee.setStatus("inactive");
        assertTrue(jwt.parseToken(token).isEmpty());

        employee.setStatus("active");
        employee.setEstablishmentId("est-other-city");
        assertTrue(jwt.parseToken(token).isEmpty());
    }
}
