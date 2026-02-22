using Zeladoria.Domain.Entities;

namespace Zeladoria.Application.Interfaces;

public interface IJwtService
{
    string GenerateToken(User user);
}
