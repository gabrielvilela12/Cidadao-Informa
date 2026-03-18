using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using CidadaoInforma.Domain.Entities;
using CidadaoInforma.Domain.Interfaces;
using CidadaoInforma.Infrastructure.Data;

namespace CidadaoInforma.Infrastructure.Repositories;

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
        return await _context.Protocols
            .Include(p => p.User)
            .OrderByDescending(p => p.CreatedAt)
            .ToListAsync();
    }

    public async Task<Protocol?> GetByIdAsync(string id)
    {
        return await _context.Protocols
            .Include(p => p.User)
            .FirstOrDefaultAsync(p => p.Id == id);
    }

    public async Task<IEnumerable<Protocol>> GetByUserIdAsync(string userId)
    {
        return await _context.Protocols
            .Include(p => p.User)
            .Where(p => p.UserId == userId)
            .OrderByDescending(p => p.CreatedAt)
            .ToListAsync();
    }

    public async Task UpdateAsync(Protocol protocol)
    {
        _context.Protocols.Update(protocol);
        await _context.SaveChangesAsync();
    }
}
