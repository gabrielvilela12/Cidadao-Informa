using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Zeladoria.Domain.Entities;
using Zeladoria.Domain.Interfaces;
using Zeladoria.Infrastructure.Data;

namespace Zeladoria.Infrastructure.Repositories;

public class UserRepository : IUserRepository
{
    private readonly ApplicationDbContext _context;

    public UserRepository(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<User> AddAsync(User user)
    {
        _context.Users.Add(user);
        await _context.SaveChangesAsync();
        return user;
    }

    public async Task<User?> GetByCpfAsync(string cpf)
    {
        return await _context.Users.SingleOrDefaultAsync(x => x.Cpf == cpf);
    }

    public async Task<User?> GetByIdAsync(string id)
    {
        return await _context.Users.FindAsync(id);
    }

    public async Task<User?> GetByEmailAsync(string email)
    {
        var lowerEmail = email.ToLowerInvariant();
        return await _context.Users.SingleOrDefaultAsync(x => x.Email == lowerEmail);
    }
}
