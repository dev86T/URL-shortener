using System.Security.Claims;
using AnalyticsService.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace AnalyticsService.Controllers;

[ApiController]
[Route("api/stats")]
[Authorize]
public class StatsController(AppDbContext db) : ControllerBase
{
    [HttpGet("me")]
    public async Task<IActionResult> Me()
    {
        var userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        var stats = await db.UserStats.FirstOrDefaultAsync(u => u.UserId == userId);
        if (stats is null) return NotFound();
        return Ok(new { stats.UserId, stats.Email, stats.TotalLinks, stats.RegisteredAt });
    }
}
