using System;
using System.Threading.Tasks;
using Zeladoria.Application.DTOs;
using Zeladoria.Domain.Entities;
using Zeladoria.Domain.Interfaces;

namespace Zeladoria.Application.UseCases.Protocols;

/// <summary>
/// Caso de uso para criação de novas solicitações de zeladoria (Protocolos).
/// Traduz os dados recebidos da requisição num novo objeto de domínio persistido.
/// </summary>
public class CreateProtocolUseCase
{
    private readonly IProtocolRepository _repository;

    public CreateProtocolUseCase(IProtocolRepository repository)
    {
        _repository = repository;
    }

    /// <summary>
    /// Executa a rotina de registro de um novo protocolo na base de dados.
    /// </summary>
    /// <param name="input">Objeto contendo dados básicos da solicitação preenchidos pelo cidadão.</param>
    /// <returns>O Protocolo persistido, modelado no formato de saída (DTO).</returns>
    public async Task<ProtocolOutputDto> ExecuteAsync(ProtocolInputDto input)
    {
        var protocol = new Protocol
        {
            Category = input.Category,
            Description = input.Description,
            Address = input.Address,
            UserId = input.UserId
        };

        var createdProtocol = await _repository.AddAsync(protocol);

        return new ProtocolOutputDto
        {
            Id = createdProtocol.Id,
            Category = createdProtocol.Category,
            Description = createdProtocol.Description,
            Address = createdProtocol.Address,
            CreatedAt = createdProtocol.CreatedAt,
            Status = createdProtocol.Status.ToString(),
            UserId = createdProtocol.UserId
        };
    }
}
