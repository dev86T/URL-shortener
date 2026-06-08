using Microsoft.EntityFrameworkCore;
using RedirectorService.Models;

namespace RedirectorService.Data;

public class AppDbContext(DbContextOptions<AppDbContext> options) : DbContext(options)
{
    public DbSet<ShortLink> ShortLinks => Set<ShortLink>();
}
