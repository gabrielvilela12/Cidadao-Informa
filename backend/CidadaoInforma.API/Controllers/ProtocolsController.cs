using System;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using CidadaoInforma.Application.DTOs;
using CidadaoInforma.Application.UseCases.Protocols;

namespace CidadaoInforma.API.Controllers;

/// <summary>
/// Controlador responsável pelo gerenciamento de Protocolos (solicitações de CidadaoInforma).
/// Requer autenticação (Token JWT) para acessar os endpoints.
/// </summary>
[ApiController]
[Route("api/[controller]")]
[Authorize]
public class ProtocolsController : ControllerBase
{
    private readonly CreateProtocolUseCase _createProtocolUseCase;
    private readonly GetProtocolsUseCase _getProtocolsUseCase;

    public ProtocolsController(CreateProtocolUseCase createProtocolUseCase, GetProtocolsUseCase getProtocolsUseCase)
    {
        _createProtocolUseCase = createProtocolUseCase;
        _getProtocolsUseCase = getProtocolsUseCase;
    }

    /// <summary>
    /// Cria uma nova solicitação/protocolo de CidadaoInforma (ex: buraco na via).
    /// </summary>
    /// <param name="input">Os dados da solicitação (Categoria, Descrição, Endereço e ID do Usuário).</param>
    /// <returns>Retorna o protocolo criado com seu respectivo ID de acompanhamento.</returns>
    /// <response code="201">Protocolo criado com sucesso.</response>
    /// <response code="400">Dados inválidos enviados na requisição.</response>
    [HttpPost]
    public async Task<IActionResult> CreateProtocol([FromBody] ProtocolInputDto input)
    {
        try
        {
            var result = await _createProtocolUseCase.ExecuteAsync(input);
            return CreatedAtAction(nameof(GetProtocols), new { id = result.Id }, result);
        }
        catch (Exception ex)
        {
            return BadRequest(new { Error = ex.Message });
        }
    }

    /// <summary>
    /// Lista os protocolos registrados no sistema.
    /// Pode ser filtrado pelo ID do usuário solicitante.
    /// </summary>
    /// <param name="userId">ID do usuário em formato de string (Opcional).</param>
    /// <returns>Lista de protocolos ativos formatados para o frontend.</returns>
    /// <response code="200">Lista recuperada com sucesso.</response>
    /// <response code="500">Erro interno de servidor ao processar a lista.</response>
    [HttpGet]
    public async Task<IActionResult> GetProtocols([FromQuery] string? userId)
    {
        try
        {
            var results = await _getProtocolsUseCase.ExecuteAsync(userId);
            return Ok(results);
        }
        catch (Exception ex)
        {
            return StatusCode(500, new { Error = ex.Message });
        }
    }
}
