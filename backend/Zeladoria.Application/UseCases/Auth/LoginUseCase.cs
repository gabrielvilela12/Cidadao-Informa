using System;
using System.Threading.Tasks;
using Zeladoria.Application.DTOs;
using Zeladoria.Application.Interfaces;
using Zeladoria.Application.Utils;
using Zeladoria.Domain.Interfaces;

namespace Zeladoria.Application.UseCases.Auth;

/// <summary>
/// Caso de uso responsável por realizar o login de usuários no sistema.
/// Encapsula a lógica de negócio para validação de credenciais e geração de JWT.
/// </summary>
public class LoginUseCase
{
    private readonly IUserRepository _userRepository;
    private readonly IJwtService _jwtService;

    public LoginUseCase(IUserRepository userRepository, IJwtService jwtService)
    {
        _userRepository = userRepository;
        _jwtService = jwtService;
    }

    /// <summary>
    /// Executa o fluxo principal de autenticação.
    /// </summary>
    /// <param name="input">Dados de entrada do usuário (CPF e Senha).</param>
    /// <returns>DTO contendo o Token JWT gerado e os dados de perfil do usuário.</returns>
    /// <exception cref="Exception">Lançada caso o CPF não seja encontrado ou a senha esteja incorreta.</exception>
    public async Task<AuthOutputDto> ExecuteAsync(LoginInputDto input)
    {
        var user = await _userRepository.GetByCpfAsync(input.Cpf);

        if (user == null || !AuthUtils.VerifyPassword(input.Password, user.PasswordHash))
        {
            throw new Exception("CPF ou senha inválidos.");
        }

        var token = _jwtService.GenerateToken(user);

        return new AuthOutputDto
        {
            Token = token,
            Name = user.Name,
            Email = user.Email,
            Cpf = user.Cpf,
            Role = user.Role,
            UserId = user.Id.ToString(),
            CreatedAt = user.CreatedAt
        };
    }
}
