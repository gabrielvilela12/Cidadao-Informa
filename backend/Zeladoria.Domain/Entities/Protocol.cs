using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Zeladoria.Domain.Enums;

namespace Zeladoria.Domain.Entities;

/// <summary>
/// Entidade de domínio representando uma solicitação aberta por um cidadão 
/// ou administrada pela prefeitura (Eixo central do negócio).
/// </summary>
[Table("protocols")]
public class Protocol
{
    [Key]
    [Column("id")]
    public string Id { get; set; } = Guid.NewGuid().ToString();

    [Column("category")]
    public string Category { get; set; } = string.Empty;

    [Column("description")]
    public string Description { get; set; } = string.Empty;

    [Column("address")]
    public string Address { get; set; } = string.Empty;

    [Column("created_at")]
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    [Column("status")]
    public string Status { get; set; } = ProtocolStatus.Open.ToString();

    [Column("user_id")]
    public string UserId { get; set; } = string.Empty;

    [ForeignKey(nameof(UserId))]
    public User? User { get; set; }

    [Column("requester")]
    public string Requester { get; set; } = string.Empty;
}
