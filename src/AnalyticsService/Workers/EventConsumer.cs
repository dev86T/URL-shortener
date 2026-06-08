using System.Text;
using System.Text.Json;
using AnalyticsService.Data;
using AnalyticsService.Models;
using Microsoft.EntityFrameworkCore;
using RabbitMQ.Client;
using RabbitMQ.Client.Events;

namespace AnalyticsService.Workers;

public class EventConsumer(IConfiguration config, IServiceScopeFactory scopeFactory, ILogger<EventConsumer> logger)
    : BackgroundService
{
    private IConnection? _connection;
    private IChannel? _channel;

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        await WaitForRabbitAsync(stoppingToken);

        var factory = new ConnectionFactory { HostName = config["RabbitMQ:Host"] ?? "rabbitmq" };
        _connection = await factory.CreateConnectionAsync(stoppingToken);
        _channel = await _connection.CreateChannelAsync(cancellationToken: stoppingToken);

        await _channel.ExchangeDeclareAsync("events", ExchangeType.Topic, durable: true, cancellationToken: stoppingToken);

        await DeclareAndConsumeAsync("analytics.user.registered", "user.registered",
            HandleUserRegisteredAsync, stoppingToken);

        await DeclareAndConsumeAsync("analytics.link.created", "link.created",
            HandleLinkCreatedAsync, stoppingToken);

        await Task.Delay(Timeout.Infinite, stoppingToken);
    }

    private async Task DeclareAndConsumeAsync(string queue, string routingKey,
        Func<string, Task> handler, CancellationToken ct)
    {
        await _channel!.QueueDeclareAsync(queue, durable: true, exclusive: false, autoDelete: false, cancellationToken: ct);
        await _channel.QueueBindAsync(queue, "events", routingKey, cancellationToken: ct);

        var consumer = new AsyncEventingBasicConsumer(_channel);
        consumer.ReceivedAsync += async (_, ea) =>
        {
            var body = Encoding.UTF8.GetString(ea.Body.ToArray());
            try
            {
                await handler(body);
                await _channel.BasicAckAsync(ea.DeliveryTag, false);
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "Failed to handle message on {Queue}", queue);
                await _channel.BasicNackAsync(ea.DeliveryTag, false, requeue: false);
            }
        };

        await _channel.BasicConsumeAsync(queue, autoAck: false, consumer: consumer, cancellationToken: ct);
    }

    private async Task HandleUserRegisteredAsync(string body)
    {
        var msg = JsonSerializer.Deserialize<UserRegisteredMessage>(body, JsonOptions)!;
        using var scope = scopeFactory.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();

        if (!await db.UserStats.AnyAsync(u => u.UserId == msg.UserId))
        {
            db.UserStats.Add(new UserStats { UserId = msg.UserId, Email = msg.Email });
            await db.SaveChangesAsync();
            logger.LogInformation("Created stats profile for user {UserId}", msg.UserId);
        }
    }

    private async Task HandleLinkCreatedAsync(string body)
    {
        var msg = JsonSerializer.Deserialize<LinkCreatedMessage>(body, JsonOptions)!;
        using var scope = scopeFactory.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();

        var stats = await db.UserStats.FindAsync(msg.UserId);
        if (stats is not null)
        {
            stats.TotalLinks++;
            await db.SaveChangesAsync();
            logger.LogInformation("Incremented link count for user {UserId}", msg.UserId);
        }
    }

    private async Task WaitForRabbitAsync(CancellationToken ct)
    {
        var factory = new ConnectionFactory { HostName = config["RabbitMQ:Host"] ?? "rabbitmq" };
        for (var i = 0; i < 15; i++)
        {
            try
            {
                using var conn = await factory.CreateConnectionAsync(ct);
                return;
            }
            catch
            {
                logger.LogWarning("RabbitMQ not ready, retry {Attempt}/15", i + 1);
                await Task.Delay(3000, ct);
            }
        }
    }

    public override async Task StopAsync(CancellationToken cancellationToken)
    {
        if (_channel is not null) await _channel.CloseAsync(cancellationToken);
        if (_connection is not null) await _connection.CloseAsync(cancellationToken);
        await base.StopAsync(cancellationToken);
    }

    private static readonly JsonSerializerOptions JsonOptions = new(JsonSerializerDefaults.Web);

    private record UserRegisteredMessage(Guid UserId, string Email);
    private record LinkCreatedMessage(Guid LinkId, Guid UserId, string Code);
}
