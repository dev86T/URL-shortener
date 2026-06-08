using System.Text;
using System.Text.Json;
using RabbitMQ.Client;

namespace AuthService.Services;

public interface IRabbitPublisher
{
    void Publish(string routingKey, object message);
}

public class RabbitPublisher : IRabbitPublisher, IDisposable
{
    private readonly IConnection _connection;
    private readonly IChannel _channel;

    public RabbitPublisher(IConfiguration config)
    {
        var factory = new ConnectionFactory { HostName = config["RabbitMQ:Host"] ?? "rabbitmq" };
        _connection = factory.CreateConnectionAsync().GetAwaiter().GetResult();
        _channel = _connection.CreateChannelAsync().GetAwaiter().GetResult();
        _channel.ExchangeDeclareAsync("events", ExchangeType.Topic, durable: true).GetAwaiter().GetResult();
    }

    public void Publish(string routingKey, object message)
    {
        var body = Encoding.UTF8.GetBytes(JsonSerializer.Serialize(message));
        _channel.BasicPublishAsync("events", routingKey, body).GetAwaiter().GetResult();
    }

    public void Dispose()
    {
        _channel.CloseAsync().GetAwaiter().GetResult();
        _connection.CloseAsync().GetAwaiter().GetResult();
    }
}
