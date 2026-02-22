using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Zeladoria.Application.DTOs;
using Zeladoria.Domain.Interfaces;

namespace Zeladoria.Application.UseCases.Protocols;

/// <summary>
/// Caso de uso encarregado de buscar protocolos gravados na base.
/// Capaz de retornar listagens parciais (por usuário) ou globais (para Admins).
/// </summary>
public class GetProtocolsUseCase
{
    private readonly IProtocolRepository _repository;

    public GetProtocolsUseCase(IProtocolRepository repository)
    {
        _repository = repository;
    }

    /// <summary>
    /// Realiza a busca no repositório com base no filtro aplicado.
    /// </summary>
    /// <param name="userId">Identificador do cidadão. Se nulo, busca todos os registros.</param>
    /// <returns>Lista de objetos DTO contendo o estado resumido e detalhado de cada protocolo.</returns>
    public async Task<IEnumerable<ProtocolOutputDto>> ExecuteAsync(string? userId)
    {
        var protocols = !string.IsNullOrEmpty(userId)
            ? await _repository.GetByUserIdAsync(userId)
            : await _repository.GetAllAsync();

        return protocols.Select(p => new ProtocolOutputDto
        {
            Id = p.Id,
            Category = p.Category,
            Description = p.Description,
            Address = p.Address,
            CreatedAt = p.CreatedAt,
            Status = p.Status.ToString(),
            UserId = p.UserId,
            UserName = p.User?.Name ?? "Unknown"
        });
    }
}
