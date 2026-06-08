namespace AnalyticsService.Models;

public class UserStats
{
    public Guid UserId { get; set; }
    public string Email { get; set; } = string.Empty;
    public int TotalLinks { get; set; }
    public DateTime RegisteredAt { get; set; } = DateTime.UtcNow;
}
