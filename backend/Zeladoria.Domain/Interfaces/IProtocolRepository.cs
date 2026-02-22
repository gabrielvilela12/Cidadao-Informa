using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using Zeladoria.Domain.Entities;

namespace Zeladoria.Domain.Interfaces;

public interface IProtocolRepository
{
    Task<Protocol> AddAsync(Protocol protocol);
    Task<Protocol?> GetByIdAsync(string id);
    Task<IEnumerable<Protocol>> GetAllAsync();
    Task<IEnumerable<Protocol>> GetByUserIdAsync(string userId);
    Task UpdateAsync(Protocol protocol);
}
