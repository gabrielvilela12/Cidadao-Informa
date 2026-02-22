using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Zeladoria.Domain.Entities;
using Zeladoria.Domain.Interfaces;
using Zeladoria.Infrastructure.Data;

namespace Zeladoria.Infrastructure.Repositories;

public class ProtocolRepository : IProtocolRepository
{
    private readonly ApplicationDbContext _context;

    public ProtocolRepository(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<Protocol> AddAsync(Protocol protocol)
    {
        _context.Protocols.Add(protocol);
        await _context.SaveChangesAsync();
        return protocol;
    }

    public async Task<IEnumerable<Protocol>> GetAllAsync()
    {
        return await _context.Protocols.ToListAsync();
    }

    public async Task<Protocol?> GetByIdAsync(string id)
    {
        return await _context.Protocols.FindAsync(id);
    }

    public async Task<IEnumerable<Protocol>> GetByUserIdAsync(string userId)
    {
        return await _context.Protocols.Where(p => p.UserId == userId).ToListAsync();
    }

    public async Task UpdateAsync(Protocol protocol)
    {
        _context.Protocols.Update(protocol);
        await _context.SaveChangesAsync();
    }
}
