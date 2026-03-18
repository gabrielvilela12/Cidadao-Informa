using System;
using System.Threading.Tasks;
using CidadaoInforma.Domain.Entities;

namespace CidadaoInforma.Domain.Interfaces;

public interface IUserRepository
{
    Task<User?> GetByCpfAsync(string cpf);
    Task<User?> GetByEmailAsync(string email);
    Task<User?> GetByIdAsync(string id);
    Task<User> AddAsync(User user);
}
