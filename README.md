# URL Shortener — Microservices Pet Project

Учебный проект для изучения микросервисной архитектуры, брокеров сообщений и observability на стеке .NET 10 + React.

---

## Содержание

- [Цели проекта](#цели-проекта)
- [Архитектура](#архитектура)
- [Сервисы](#сервисы)
- [Технологии и зачем они здесь](#технологии-и-зачем-они-здесь)
- [Потоки данных](#потоки-данных)
- [Запуск](#запуск)
- [Структура проекта](#структура-проекта)

---

## Цели проекта

Проект создан ради технологий:

| Что изучаем | Как реализовано |
|---|---|
| Микросервисная архитектура | 4 изолированных .NET сервиса с собственными БД |
| API Gateway | Nginx как единая точка входа |
| Брокер сообщений | RabbitMQ, паттерн Publish/Subscribe |
| Distributed Tracing | OpenTelemetry + Jaeger |
| Health Checks | Встроенные health endpoints на каждом сервисе |
| Контейнеризация | Docker + Docker Compose |

---

## Архитектура

```
Browser
   │
   ▼
┌─────────────────────────────────────────┐
│            Nginx Gateway :80            │
│                                         │
│  /api/auth/**     → auth-service        │
│  /api/shorten     → shortener-service   │
│  /api/my-links    → shortener-service   │
│  /api/stats/**    → analytics-service   │
│  /r/{code}        → redirector-service  │
│  /                → frontend            │
└─────────────────────────────────────────┘
   │           │           │           │
   ▼           ▼           ▼           ▼
 auth       shortener   redirector  analytics
   │           │                       ▲
   │           │                       │
   └───────────┴──── RabbitMQ ─────────┘
                    (events exchange)

   auth      → publishes: user.registered
   shortener → publishes: link.created
   analytics → consumes:  user.registered, link.created

   Все сервисы → OpenTelemetry → Jaeger
```

### Принцип изоляции баз данных

Каждый сервис владеет своей базой данных. Сервисы **не ходят в чужие БД** напрямую — только через события или API. Это ключевой принцип микросервисов: база является деталью реализации сервиса, а не общим ресурсом.

| Сервис | База данных |
|---|---|
| auth-service | `auth_db` |
| shortener-service | `shortener_db` |
| redirector-service | `shortener_db` (read-only, shared) |
| analytics-service | `analytics_db` |

> **Исключение:** `redirector-service` читает из `shortener_db`. Это осознанный компромисс для пет-проекта — в продакшне редиректор получал бы данные через собственный read-model или кэш.

---

## Сервисы

### Auth Service

**Что делает:** регистрация и вход пользователей, выдача JWT-токенов.

**Эндпоинты:**
```
POST /api/auth/register   { email, password } → { token }
POST /api/auth/login      { email, password } → { token }
GET  /health
```

**Зачем отдельный сервис:** авторизация — это отдельный bounded context. Если завтра нужно добавить OAuth или 2FA, это изменение затронет только один сервис, не ломая остальные.

**После регистрации** публикует событие `user.registered` в RabbitMQ. Analytics-сервис подхватывает его и создаёт профиль пользователя для статистики.

---

### Shortener Service

**Что делает:** принимает длинный URL, генерирует короткий код, сохраняет в БД.

**Эндпоинты:**
```
POST /api/shorten     { url }  → { code, shortUrl, originalUrl }
GET  /api/my-links             → [ { code, originalUrl, createdAt } ]
GET  /health
```

**Гостевой режим:** JWT-токен опционален. Если пользователь не авторизован — ссылка создаётся без привязки к аккаунту (`user_id = null`). Если авторизован — ссылка привязывается и публикуется событие `link.created`.

**Генерация кода:** берёт GUID, кодирует в Base64, обрезает до 8 символов. Быстро, без коллизий для пет-проекта.

---

### Redirector Service

**Что делает:** принимает короткий код, ищет оригинальный URL, возвращает 302 redirect.

**Эндпоинты:**
```
GET /r/{code} → 302 redirect
GET /health
```

**Зачем отдельный сервис:** редиректы — это hot path. Этот сервис обрабатывает самые частые запросы и при необходимости масштабируется независимо от остальных. Он не занимается созданием ссылок — только чтением.

---

### Analytics Service

**Что делает:** слушает события из RabbitMQ, ведёт статистику по пользователям.

**Эндпоинты:**
```
GET /api/stats/me   → { userId, email, totalLinks, registeredAt }
GET /health
```

**Как работает:** содержит `BackgroundService` (воркер), который подписывается на две очереди:
- `analytics.user.registered` → создаёт запись `UserStats` при регистрации
- `analytics.link.created` → инкрементирует `TotalLinks` при создании ссылки

**Retry-логика:** при старте воркер ждёт RabbitMQ до 15 попыток с интервалом 3 секунды — это нужно, потому что в Docker Compose сервисы стартуют параллельно и брокер может быть ещё не готов.

---

## Технологии и зачем они здесь

### RabbitMQ — брокер сообщений

RabbitMQ используется по паттерну **Topic Exchange**: сообщения публикуются с routing key (`user.registered`, `link.created`), подписчики объявляют очереди и биндят их к нужным ключам.

**Зачем это лучше прямых HTTP-вызовов между сервисами:**
- `auth-service` не знает о существовании `analytics-service` — слабая связность
- если `analytics-service` упал, события не потеряются — они накопятся в очереди
- добавить нового подписчика на событие можно без изменения издателя

```
auth-service                     analytics-service
     │                                  │
     │  publish("user.registered")      │
     └──────── events exchange ─────────┘
                    (topic)
```

### OpenTelemetry + Jaeger — distributed tracing

Каждый сервис инструментирован через `OpenTelemetry.Instrumentation.AspNetCore`. Трейсы экспортируются по протоколу **OTLP** (OpenTelemetry Protocol) на порт `4317` контейнера Jaeger.

**Что видно в Jaeger UI (`http://localhost:16686`):**
- Каждый HTTP-запрос — отдельный span с временем выполнения
- Запрос через Gateway виден как цепочка: nginx → сервис → база данных
- Можно сравнивать latency разных эндпоинтов

**Почему OTLP, а не устаревший Jaeger-клиент:** `OpenTelemetry.Exporter.Jaeger` deprecated. OTLP — vendor-neutral протокол, работающий с Jaeger, Grafana Tempo, Zipkin и другими backend'ами без смены кода.

### Health Checks

Каждый .NET сервис регистрирует проверку через `AddDbContextCheck<AppDbContext>()` — она проверяет, что база данных доступна и соединение работает.

Эндпоинт `/health` отвечает:
- `200 Healthy` — сервис и БД в порядке
- `503 Unhealthy` — что-то сломано

В продакшне эти эндпоинты используются оркестраторами (Kubernetes, Consul) для автоматического перезапуска упавших инстансов и исключения нездоровых нод из балансировки.

### Nginx — API Gateway

Nginx выступает **единой точкой входа**: весь трафик идёт через порт `80`, и Nginx роутит запросы на нужный сервис по префиксу пути.

**Что это даёт:**
- Клиент не знает, на каком порту и хосте живут сервисы
- Можно добавить rate limiting, SSL termination, кэширование — в одном месте
- Сервисы не торчат наружу — они доступны только внутри Docker-сети

### JWT — авторизация без состояния

Токен содержит `userId` и `email` в payload. Каждый сервис валидирует токен самостоятельно по общему секрету — без обращения к `auth-service`. Это позволяет сервисам работать независимо и горизонтально масштабироваться.

---

## Потоки данных

### Регистрация пользователя

```
1. Browser  →  POST /api/auth/register
2. Gateway  →  auth-service
3. auth-service → сохраняет User в auth_db
4. auth-service → публикует {UserId, Email} в RabbitMQ → "user.registered"
5. auth-service → возвращает JWT
6. analytics-service (async) → получает событие → создаёт UserStats в analytics_db
```

### Создание ссылки (авторизованный пользователь)

```
1. Browser  →  POST /api/shorten  (Authorization: Bearer <token>)
2. Gateway  →  shortener-service
3. shortener-service → валидирует JWT → извлекает userId
4. shortener-service → сохраняет ShortLink в shortener_db
5. shortener-service → публикует {LinkId, UserId, Code} → "link.created"
6. shortener-service → возвращает { code, shortUrl }
7. analytics-service (async) → получает событие → инкрементирует TotalLinks
```

### Редирект

```
1. Browser  →  GET /r/aBcD1234
2. Gateway  →  redirector-service
3. redirector-service → SELECT из shortener_db WHERE code = 'aBcD1234'
4. redirector-service → 302 → https://original-url.com
```

---

## Запуск

### Требования

- Docker Desktop
- Docker Compose v2

### Команды

```bash
# Клонировать и запустить
git clone <repo>
cd UrlShortener
docker compose up --build

# Остановить
docker compose down

# Остановить и удалить данные
docker compose down -v
```

### Доступные адреса после старта

| Адрес | Что |
|---|---|
| `http://localhost` | Веб-приложение |
| `http://localhost:16686` | Jaeger UI — distributed tracing |
| `http://localhost:15672` | RabbitMQ Management (guest / guest) |

### Первый запуск занимает время

Docker скачивает образы и компилирует .NET проекты внутри контейнеров. Повторные запуски значительно быстрее за счёт кэша слоёв.

---

## Структура проекта

```
UrlShortener/
├── docker-compose.yml
├── gateway/
│   └── nginx.conf
├── src/
│   ├── AuthService/
│   │   ├── Controllers/AuthController.cs
│   │   ├── Data/AppDbContext.cs
│   │   ├── Data/Migrations/
│   │   ├── Models/User.cs
│   │   ├── Services/AuthService.cs
│   │   ├── Services/RabbitPublisher.cs
│   │   ├── Program.cs
│   │   └── Dockerfile
│   ├── ShortenerService/
│   │   ├── Controllers/ShortenerController.cs
│   │   ├── Data/AppDbContext.cs
│   │   ├── Data/Migrations/
│   │   ├── Models/ShortLink.cs
│   │   ├── Services/RabbitPublisher.cs
│   │   ├── Program.cs
│   │   └── Dockerfile
│   ├── RedirectorService/
│   │   ├── Controllers/RedirectController.cs
│   │   ├── Data/AppDbContext.cs
│   │   ├── Models/ShortLink.cs
│   │   ├── Program.cs
│   │   └── Dockerfile
│   └── AnalyticsService/
│       ├── Controllers/StatsController.cs
│       ├── Data/AppDbContext.cs
│       ├── Data/Migrations/
│       ├── Models/UserStats.cs
│       ├── Workers/EventConsumer.cs
│       ├── Program.cs
│       └── Dockerfile
└── frontend/
    ├── src/
    │   ├── pages/Home.jsx
    │   ├── pages/Login.jsx
    │   ├── pages/Register.jsx
    │   ├── pages/Dashboard.jsx
    │   ├── components/Navbar.jsx
    │   ├── api.js
    │   └── App.jsx
    ├── Dockerfile
    └── nginx.conf
```
