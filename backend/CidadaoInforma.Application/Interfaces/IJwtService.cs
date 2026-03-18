using CidadaoInforma.Domain.Entities;

namespace CidadaoInforma.Application.Interfaces;

public interface IJwtService
{
    string GenerateToken(User user);
}
