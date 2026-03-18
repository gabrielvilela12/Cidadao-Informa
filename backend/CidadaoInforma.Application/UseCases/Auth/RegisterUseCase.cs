using System;
using System.Threading.Tasks;
using CidadaoInforma.Application.DTOs;
using CidadaoInforma.Application.Interfaces;
using CidadaoInforma.Application.Utils;
using CidadaoInforma.Domain.Entities;
using CidadaoInforma.Domain.Interfaces;

namespace CidadaoInforma.Application.UseCases.Auth;

/// <summary>
/// Caso de uso dedicado ao registro de novos Cidadãos.
/// Agrupa validações de domínio (tamanho de CPF, força de senha, e e-mail único).
/// </summary>
public class RegisterUseCase
{
    private readonly IUserRepository _userRepository;
    private readonly IJwtService _jwtService;

    public RegisterUseCase(IUserRepository userRepository, IJwtService jwtService)
    {
        _userRepository = userRepository;
        _jwtService = jwtService;
    }

    /// <summary>
    /// Executa o processo de criação de uma nova conta de usuário.
    /// Checa ativamente a duplicidade na base de dados (CPF/E-mail).
    /// </summary>
    /// <param name="input">Objeto contendo Nome, E-mail, CPF e Senha recebidos via API.</param>
    /// <returns>Um token JWT e detalhes do usuário recém-criado, facilitando o auto-login.</returns>
    /// <exception cref="Exception">Lançada se houver violação nas validações pré-definidas.</exception>
    public async Task<AuthOutputDto> ExecuteAsync(RegisterInputDto input)
    {
        if (string.IsNullOrWhiteSpace(input.Name))
            throw new Exception("O Nome Completo é obrigatório.");

        if (string.IsNullOrWhiteSpace(input.Cpf) || input.Cpf.Length != 11)
            throw new Exception("O CPF deve ter exatamente 11 dígitos.");

        if (string.IsNullOrWhiteSpace(input.Email) || !input.Email.Contains("@"))
            throw new Exception("Por favor, informe um E-mail válido.");

        var normalizedEmail = input.Email.Trim().ToLowerInvariant();

        if (string.IsNullOrWhiteSpace(input.Password) || input.Password.Length < 6)
            throw new Exception("A senha deve ter pelo menos 6 caracteres.");

        var existingUserCpf = await _userRepository.GetByCpfAsync(input.Cpf);
        if (existingUserCpf != null)
        {
            throw new Exception("Já existe uma conta cadastrada com este CPF.");
        }

        var existingUserEmail = await _userRepository.GetByEmailAsync(normalizedEmail);
        if (existingUserEmail != null)
        {
            throw new Exception("Já existe uma conta cadastrada com este E-mail.");
        }

        var user = new User
        {
            Name = input.Name,
            Email = normalizedEmail,
            Cpf = input.Cpf,
            PasswordHash = AuthUtils.HashPassword(input.Password),
            Role = "citizen"
        };

        var createdUser = await _userRepository.AddAsync(user);
        var token = _jwtService.GenerateToken(createdUser);

        return new AuthOutputDto
        {
            Token = token,
            Name = createdUser.Name,
            Email = createdUser.Email,
            Cpf = createdUser.Cpf,
            Role = createdUser.Role,
            UserId = createdUser.Id.ToString(),
            CreatedAt = createdUser.CreatedAt
        };
    }
}
