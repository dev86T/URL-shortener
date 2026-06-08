using Microsoft.EntityFrameworkCore;
using ShortenerService.Models;

namespace ShortenerService.Data;

public class AppDbContext(DbContextOptions<AppDbContext> options) : DbContext(options)
{
    public DbSet<ShortLink> ShortLinks => Set<ShortLink>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<ShortLink>().HasIndex(x => x.Code).IsUnique();
    }
}
