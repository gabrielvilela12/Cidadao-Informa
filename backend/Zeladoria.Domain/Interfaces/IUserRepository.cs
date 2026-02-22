using System;
using System.Threading.Tasks;
using Zeladoria.Domain.Entities;

namespace Zeladoria.Domain.Interfaces;

public interface IUserRepository
{
    Task<User?> GetByCpfAsync(string cpf);
    Task<User?> GetByEmailAsync(string email);
    Task<User?> GetByIdAsync(string id);
    Task<User> AddAsync(User user);
}
