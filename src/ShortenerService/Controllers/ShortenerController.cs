using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ShortenerService.Data;
using ShortenerService.Models;
using ShortenerService.Services;

namespace ShortenerService.Controllers;

public record ShortenRequest(string Url);

[ApiController]
[Route("api")]
public class ShortenerController(AppDbContext db, IRabbitPublisher publisher) : ControllerBase
{
    [HttpPost("shorten")]
    public async Task<IActionResult> Shorten([FromBody] ShortenRequest request)
    {
        if (!Uri.TryCreate(request.Url, UriKind.Absolute, out _))
            return BadRequest(new { error = "Invalid URL" });

        Guid? userId = null;
        if (User.Identity?.IsAuthenticated == true)
            userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

        var code = GenerateCode();
        var link = new ShortLink { Code = code, OriginalUrl = request.Url, UserId = userId };
        db.ShortLinks.Add(link);
        await db.SaveChangesAsync();

        if (userId.HasValue)
            publisher.Publish("link.created", new { LinkId = link.Id, UserId = userId, Code = code });

        return Ok(new { code, shortUrl = $"/r/{code}", originalUrl = request.Url });
    }

    [Authorize]
    [HttpGet("my-links")]
    public async Task<IActionResult> MyLinks()
    {
        var userId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
        var links = await db.ShortLinks
            .Where(l => l.UserId == userId)
            .OrderByDescending(l => l.CreatedAt)
            .Select(l => new { l.Code, l.OriginalUrl, l.CreatedAt })
            .ToListAsync();
        return Ok(links);
    }

    private static string GenerateCode() =>
        Convert.ToBase64String(Guid.NewGuid().ToByteArray())[..8]
            .Replace("/", "_").Replace("+", "-");
}
