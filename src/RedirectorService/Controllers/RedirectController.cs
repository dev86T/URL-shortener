using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using RedirectorService.Data;

namespace RedirectorService.Controllers;

[ApiController]
public class RedirectController(AppDbContext db) : ControllerBase
{
    [HttpGet("/r/{code}")]
    public async Task<IActionResult> Go(string code)
    {
        var link = await db.ShortLinks.FirstOrDefaultAsync(l => l.Code == code);
        if (link is null) return NotFound();
        return new RedirectResult(link.OriginalUrl);
    }
}
