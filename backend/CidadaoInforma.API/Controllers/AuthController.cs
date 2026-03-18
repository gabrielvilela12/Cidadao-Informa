using System;
using System.Threading.Tasks;
using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using CidadaoInforma.Application.DTOs;
using CidadaoInforma.Application.UseCases.Auth;

namespace CidadaoInforma.API.Controllers;

/// <summary>
/// Controlador responsável pelas operações de autenticação e registro de usuários.
/// Gerencia o fluxo de entrada para cidadãos e administradores.
/// </summary>
[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly LoginUseCase _loginUseCase;
    private readonly RegisterUseCase _registerUseCase;
    private readonly GetMeUseCase _getMeUseCase;

    public AuthController(LoginUseCase loginUseCase, RegisterUseCase registerUseCase, GetMeUseCase getMeUseCase)
    {
        _loginUseCase = loginUseCase;
        _registerUseCase = registerUseCase;
        _getMeUseCase = getMeUseCase;
    }

    /// <summary>
    /// Autentica um usuário existente no sistema.
    /// </summary>
    /// <param name="input">Dados de login contendo CPF e Senha estruturados num DTO.</param>
    /// <returns>Retorna o Token JWT e dados básicos do usuário logado.</returns>
    /// <response code="200">Login bem-sucedido.</response>
    /// <response code="401">Credenciais inválidas.</response>
    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] LoginInputDto input)
    {
        try
        {
            var result = await _loginUseCase.ExecuteAsync(input);
            return Ok(result);
        }
        catch (Exception ex)
        {
            return Unauthorized(new { Error = ex.Message });
        }
    }

    /// <summary>
    /// Registra um novo usuário (cidadão) na plataforma.
    /// </summary>
    /// <param name="input">Dados de cadastro como Nome, Email, CPF e Senha.</param>
    /// <returns>Retorna o ID do usuário criado e uma mensagem de sucesso.</returns>
    /// <response code="200">Usuário registrado com sucesso.</response>
    /// <response code="400">Falha na validação dos dados enviados ou usuário já existe.</response>
    [HttpPost("register")]
    public async Task<IActionResult> Register([FromBody] RegisterInputDto input)
    {
        try
        {
            var result = await _registerUseCase.ExecuteAsync(input);
            return Ok(result);
        }
        catch (Exception ex)
        {
            return BadRequest(new { Error = ex.Message });
        }
    }

    /// <summary>
    /// Retorna os dados do usuário autenticado no sistema baseado no Token JWT atual.
    /// É usado para validar se as informações no LocalStorage (Frontend) continuam verídicas no banco (ex: caso de deleção).
    /// </summary>
    /// <returns>Dados do usuário em sessão.</returns>
    /// <response code="200">Retorna os dados válidos encontrados no banco.</response>
    /// <response code="401">O Token ou o usuário não são mais válidos.</response>
    [HttpGet("me")]
    [Authorize]
    public async Task<IActionResult> GetMe()
    {
        try
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

            if (string.IsNullOrEmpty(userIdClaim))
            {
                return Unauthorized(new { Error = "Token JWT inválido ou sem identificação do usuário." });
            }

            var result = await _getMeUseCase.ExecuteAsync(userIdClaim);
            return Ok(result);
        }
        catch (Exception ex)
        {
            // Se cair na exceção do GetMeUseCase ("Usuário não encontrado") ou outros, devolve Unauthorized.
            return Unauthorized(new { Error = ex.Message });
        }
    }
}
