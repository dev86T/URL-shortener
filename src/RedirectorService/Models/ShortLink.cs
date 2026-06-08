namespace RedirectorService.Models;

public class ShortLink
{
    public Guid Id { get; set; }
    public string Code { get; set; } = string.Empty;
    public string OriginalUrl { get; set; } = string.Empty;
    public Guid? UserId { get; set; }
    public DateTime CreatedAt { get; set; }
}
