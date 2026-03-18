using System;
using System.Threading.Tasks;
using CidadaoInforma.Application.DTOs;
using CidadaoInforma.Domain.Interfaces;

namespace CidadaoInforma.Application.UseCases.Auth;

/// <summary>
/// Caso de uso que valida se o Id fornecido pelo Token JWT pertence a um usuário válido e ativo no banco de dados.
/// </summary>
public class GetMeUseCase
{
    private readonly IUserRepository _userRepository;

    public GetMeUseCase(IUserRepository userRepository)
    {
        _userRepository = userRepository;
    }

    /// <summary>
    /// Busca o usuário pelo ID extraído do Token JWT e garante que ele ainda exista no banco de dados.
    /// </summary>
    /// <param name="userId">ID do usuário extraído das claims do JWT.</param>
    /// <returns>Dados principais do usuário se ele for válido.</returns>
    /// <exception cref="Exception">Lançada caso o usuário não seja encontrado na base (ex: usuário deletado).</exception>
    public async Task<AuthOutputDto> ExecuteAsync(string userId)
    {
        var user = await _userRepository.GetByIdAsync(userId);

        if (user == null)
        {
            throw new Exception("Usuário não encontrado ou inativo.");
        }

        return new AuthOutputDto
        {
            Token = string.Empty, // Token não será regenerado aqui, é apenas validação
            Name = user.Name,
            Email = user.Email,
            Cpf = user.Cpf,
            Role = user.Role,
            UserId = user.Id.ToString(),
            CreatedAt = user.CreatedAt
        };
    }
}
