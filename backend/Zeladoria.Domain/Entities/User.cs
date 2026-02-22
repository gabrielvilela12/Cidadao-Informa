using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Zeladoria.Domain.Entities;

/// <summary>
/// Entidade de domínio representando os usuários do sistema.
/// Pode assumir os papéis de "citizen" (Cidadão) ou "admin" (Representante da Prefeitura).
/// </summary>
[Table("users")]
public class User
{
    [Key]
    [Column("id")]
    public string Id { get; set; } = Guid.NewGuid().ToString();

    [Column("full_name")]
    public string Name { get; set; } = string.Empty;

    [Column("email")]
    public string Email { get; set; } = string.Empty;

    [Column("cpf")]
    public string Cpf { get; set; } = string.Empty;

    [Column("role")]
    public string Role { get; set; } = "citizen"; // citizen or admin

    [Column("password_hash")]
    public string PasswordHash { get; set; } = string.Empty;

    [Column("created_at")]
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
