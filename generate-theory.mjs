import {
  Document, Packer, Paragraph, TextRun, AlignmentType,
  HeadingLevel, LevelFormat, BorderStyle, PageNumber
} from "docx";
import { writeFileSync } from "fs";

// ── helpers ────────────────────────────────────────────────────────────────

function h1(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_1,
    spacing: { before: 360, after: 160 },
    children: [new TextRun({ text, bold: true, size: 32, font: "Arial" })],
  });
}

function h2(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_2,
    spacing: { before: 240, after: 120 },
    children: [new TextRun({ text, bold: true, size: 26, font: "Arial" })],
  });
}

function p(...runs) {
  return new Paragraph({
    spacing: { before: 80, after: 120 },
    children: runs.map(r =>
      typeof r === "string"
        ? new TextRun({ text: r, size: 22, font: "Arial" })
        : r
    ),
  });
}

function bold(text) {
  return new TextRun({ text, bold: true, size: 22, font: "Arial" });
}

function italic(text) {
  return new TextRun({ text, italics: true, size: 22, font: "Arial", color: "2E5F8A" });
}

function run(text) {
  return new TextRun({ text, size: 22, font: "Arial" });
}

function bullet(text, level = 0) {
  const indent = level === 0
    ? { left: 720, hanging: 360 }
    : { left: 1080, hanging: 360 };
  return new Paragraph({
    numbering: { reference: "bullets", level },
    spacing: { before: 40, after: 60 },
    indent,
    children: [new TextRun({ text, size: 22, font: "Arial" })],
  });
}

function bulletRuns(runs2, level = 0) {
  const indent = level === 0
    ? { left: 720, hanging: 360 }
    : { left: 1080, hanging: 360 };
  return new Paragraph({
    numbering: { reference: "bullets", level },
    spacing: { before: 40, after: 60 },
    indent,
    children: runs2,
  });
}

function analogy(text) {
  return new Paragraph({
    spacing: { before: 120, after: 120 },
    indent: { left: 600, right: 600 },
    border: {
      left: { style: BorderStyle.SINGLE, size: 6, color: "3B82F6", space: 10 },
    },
    children: [
      new TextRun({ text: "💡 Аналогия: ", bold: true, size: 22, font: "Arial", color: "1E3A5F" }),
      new TextRun({ text, italics: true, size: 22, font: "Arial", color: "334155" }),
    ],
  });
}

function inProject(text) {
  return new Paragraph({
    spacing: { before: 140, after: 80 },
    children: [
      new TextRun({ text: "→ В нашем проекте: ", bold: true, size: 22, font: "Arial", color: "16A34A" }),
      new TextRun({ text, size: 22, font: "Arial" }),
    ],
  });
}

function separator() {
  return new Paragraph({
    spacing: { before: 200, after: 200 },
    border: { bottom: { style: BorderStyle.SINGLE, size: 2, color: "CBD5E1", space: 1 } },
    children: [new TextRun("")],
  });
}

function pageBreak() {
  return new Paragraph({ pageBreakBefore: true, children: [new TextRun("")] });
}

// ── content ────────────────────────────────────────────────────────────────

const children = [

  // Title
  new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { before: 480, after: 120 },
    children: [new TextRun({ text: "Теория проекта URL Shortener", bold: true, size: 52, font: "Arial", color: "0F172A" })],
  }),
  new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { before: 0, after: 80 },
    children: [new TextRun({ text: "от нуля до понимания", italics: true, size: 30, font: "Arial", color: "475569" })],
  }),
  new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { before: 80, after: 600 },
    children: [new TextRun({ text: "Стек: .NET 10 · RabbitMQ · OpenTelemetry · Jaeger · Docker · React", size: 20, font: "Arial", color: "64748B" })],
  }),

  separator(),

  // ── 1. Монолит ─────────────────────────────────────────────────────────
  pageBreak(),
  h1("1. Что такое монолит и зачем от него уходят"),

  h2("Монолит — одно большое приложение"),
  p(run("Представьте, что вы пишете интернет-магазин. Там есть регистрация, каталог товаров, оплата, уведомления, аналитика. В монолитной архитектуре всё это — "), bold("один проект"), run(", один процесс, одна база данных, один деплой.")),
  analogy("Это как супермаркет «всё в одном»: касса, склад, мясной отдел, бухгалтерия — всё под одной крышей. Удобно строить, но если сломалась касса — весь магазин закрыт."),

  h2("Проблемы монолита"),
  bulletRuns([bold("Если упал один модуль — упало всё."), run(" Баг в модуле уведомлений кладёт весь сайт.")]),
  bulletRuns([bold("Нельзя масштабировать части отдельно."), run(" Если нагружен только каталог — придётся поднять копию всего приложения целиком, включая ненужные модули.")]),
  bulletRuns([bold("Большая команда мешает друг другу."), run(" Все разработчики работают в одном репозитории — мерджи, конфликты, страх сломать чужой код.")]),
  bulletRuns([bold("Долгий деплой."), run(" Изменил одну строку в уведомлениях — нужно пересобрать и задеплоить всё приложение.")]),
  bulletRuns([bold("Технологический монолит."), run(" Весь проект на одном языке, одном фреймворке. Нельзя использовать нужный инструмент для нужной задачи.")]),

  p(run("Именно эти проблемы привели к идее разбить приложение на части — "), bold("микросервисы"), run(".")),
  inProject("URL Shortener разбит на 4 изолированных сервиса: каждый живёт в своём контейнере, имеет свою базу данных и деплоится независимо."),
  separator(),

  // ── 2. Микросервисы ────────────────────────────────────────────────────
  pageBreak(),
  h1("2. Микросервисная архитектура"),

  h2("Что это такое"),
  p(run("Микросервисная архитектура — это подход, при котором приложение разбивается на набор небольших, "), bold("независимых сервисов"), run(". Каждый сервис:")),
  bullet("выполняет одну конкретную функцию (Single Responsibility)"),
  bullet("запускается как отдельный процесс"),
  bullet("имеет собственную базу данных"),
  bullet("общается с другими сервисами через API или брокер сообщений"),
  bullet("деплоится независимо"),

  analogy("Торговый центр. Каждый магазин — отдельный арендатор: своя касса, свои сотрудники, своя система учёта. Если закрылся магазин электроники — остальные продолжают работать. Новый магазин можно открыть без перестройки всего здания."),

  h2("Плюсы"),
  bulletRuns([bold("Независимое масштабирование."), run(" Если перегружен только redirector (редиректы — самая частая операция), поднимаем только его копии.")]),
  bulletRuns([bold("Независимый деплой."), run(" Обновили auth-service — остальные сервисы не перезапускались.")]),
  bulletRuns([bold("Изоляция падений."), run(" Упал analytics-service — ссылки всё равно создаются и редиректы работают.")]),
  bulletRuns([bold("Технологическое разнообразие."), run(" Можно написать один сервис на .NET, другой на Go, третий на Python.")]),

  h2("Минусы"),
  bulletRuns([bold("Сложнее в эксплуатации."), run(" Вместо одного процесса — десятки. Нужна оркестрация, мониторинг, трейсинг.")]),
  bulletRuns([bold("Сетевые вызовы."), run(" То, что раньше был вызов функции — теперь HTTP-запрос. Добавляется latency и возможность сбоя.")]),
  bulletRuns([bold("Distributed transactions."), run(" Атомарная операция в монолите — это транзакция БД. В микросервисах это сложная проблема.")]),

  h2("Database per Service"),
  p(bold("Принцип:"), run(" каждый сервис владеет только своими данными. Другие сервисы не имеют прямого доступа к чужой базе — только через API или события.")),
  p(run("Зачем это нужно:")),
  bullet("Если все сервисы пишут в одну БД, они снова становятся связанными — как монолит"),
  bullet("Один сервис может заблокировать таблицу и парализовать всех"),
  bullet("Нельзя поменять схему одного сервиса, не затронув другие"),
  bullet("Нельзя выбрать подходящую БД (Redis, Postgres, MongoDB) для каждой задачи"),

  inProject("auth-service → auth_db, shortener-service → shortener_db, analytics-service → analytics_db. Каждая база мигрируется независимо через EF Core при старте своего сервиса."),
  separator(),

  // ── 3. API Gateway ──────────────────────────────────────────────────────
  pageBreak(),
  h1("3. API Gateway"),

  h2("Проблема без Gateway"),
  p(run("Представьте: у вас 4 сервиса, каждый слушает свой порт:")),
  bullet("auth-service: http://localhost:5001"),
  bullet("shortener-service: http://localhost:5002"),
  bullet("analytics-service: http://localhost:5003"),
  bullet("redirector-service: http://localhost:5004"),

  p(run("Клиент (браузер, мобильное приложение) должен "), bold("знать адрес каждого сервиса"), run(". Стоит изменить порт или хост — нужно обновить клиент. Выставить все порты наружу — значит открыть внутренние сервисы для атак.")),

  h2("Что такое API Gateway"),
  p(bold("Gateway"), run(" — это единая точка входа. Клиент знает только один адрес (порт 80). Gateway принимает запрос, смотрит на путь и пересылает нужному сервису.")),

  analogy("Ресепшн в офисном здании. Посетитель приходит на стойку, говорит «мне нужна бухгалтерия» — охранник направляет в нужный кабинет. Посетитель не знает этажей и номеров, он знает только вход."),

  h2("Что умеет Gateway"),
  bulletRuns([bold("Роутинг."), run(" /api/auth/** → auth-service, /r/{code} → redirector-service.")]),
  bulletRuns([bold("SSL Termination."), run(" HTTPS расшифровывается на Gateway, внутри сети — HTTP.")]),
  bulletRuns([bold("Rate Limiting."), run(" Ограничение числа запросов с одного IP.")]),
  bulletRuns([bold("Авторизация."), run(" Проверка JWT до того, как запрос попадёт в сервис.")]),
  bulletRuns([bold("Логирование."), run(" Все входящие запросы видны в одном месте.")]),
  bulletRuns([bold("Load Balancing."), run(" Если сервис запущен в нескольких копиях — распределение нагрузки.")]),

  h2("Почему Nginx"),
  p(run("Nginx — это battle-tested веб-сервер и reverse proxy. Конфигурация в несколько строк, работает под огромной нагрузкой, нулевой downtime при reload конфига. Для пет-проекта — идеальный выбор. В продакшне используют также Kong, Traefik, AWS API Gateway.")),
  inProject("Nginx слушает порт 80, роутит по префиксу пути. Все .NET сервисы недоступны снаружи — только через gateway."),
  separator(),

  // ── 4. RabbitMQ ─────────────────────────────────────────────────────────
  pageBreak(),
  h1("4. Брокер сообщений и асинхронная коммуникация"),

  h2("Синхронная коммуникация (HTTP)"),
  p(run("Когда сервис A вызывает сервис B через HTTP — это "), bold("синхронный"), run(" вызов: A ждёт ответа от B. Это просто и понятно, но:")),
  bullet("Если B недоступен — A получает ошибку, операция не выполнена"),
  bullet("A и B жёстко связаны: A знает адрес B, A зависит от доступности B"),
  bullet("При высокой нагрузке B становится узким местом и тормозит всех"),

  h2("Асинхронная коммуникация"),
  p(run("При асинхронной коммуникации "), bold("издатель не ждёт ответа"), run(". Он отправляет сообщение в брокер и продолжает работу. Подписчик обработает сообщение когда сможет.")),
  analogy("Почтовый ящик. Ты пишешь письмо, опускаешь в ящик — и идёшь по своим делам. Ты не стоишь у ящика и не ждёшь, пока письмо доставят. Почтальон приедет, заберёт, доставит. Ты и адресат никогда не встречались напрямую."),

  h2("Что такое RabbitMQ"),
  p(bold("RabbitMQ"), run(" — это "), bold("брокер сообщений"), run(": посредник между издателями (publishers) и подписчиками (consumers). Его задача — принять сообщение, сохранить в очередь и доставить подписчику.")),

  h2("Exchange, Queue, Binding"),
  p(run("В RabbitMQ есть три ключевых концепции:")),
  bulletRuns([bold("Exchange"), run(" — «сортировочный центр». Принимает сообщение и решает, в какую очередь его отправить.")]),
  bulletRuns([bold("Queue"), run(" — «почтовый ящик получателя». Сообщения хранятся здесь до тех пор, пока подписчик их не заберёт.")]),
  bulletRuns([bold("Binding"), run(" — «маршрут». Правило: «сообщения с routing key X → в очередь Y».")]),

  analogy("Сортировочный центр «Почты России». Посылка прибывает с адресом на ярлыке (routing key). Сортировщик смотрит на адрес и кладёт посылку в нужную ячейку (очередь). Получатель забирает посылку из своей ячейки (consume)."),

  h2("Topic Exchange"),
  p(run("В нашем проекте используется "), bold("Topic Exchange"), run(" — тип exchange, где routing key может содержать шаблоны с подстановками. Например: subscribed на "), italic("user.*"), run(" означает «все события, начинающиеся с user.».")),
  p(run("Routing keys в проекте:")),
  bullet("user.registered — пользователь зарегистрировался"),
  bullet("link.created — пользователь создал короткую ссылку"),

  h2("Паттерн Publish/Subscribe"),
  p(run("Pub/Sub — это паттерн, при котором:")),
  bulletRuns([bold("Publisher"), run(" публикует событие и не знает, кто его получит")]),
  bulletRuns([bold("Subscriber"), run(" подписывается на интересующие события и обрабатывает их независимо")]),
  p(run("Главное преимущество: "), bold("слабая связность"), run(". auth-service публикует user.registered и не знает ничего об analytics-service. Завтра появится email-сервис — он просто подпишется на то же событие, auth-service менять не нужно.")),

  inProject("auth-service публикует user.registered → analytics-service слушает очередь analytics.user.registered и создаёт профиль. shortener-service публикует link.created → analytics-service инкрементирует счётчик ссылок."),
  separator(),

  // ── 5. Docker ───────────────────────────────────────────────────────────
  pageBreak(),
  h1("5. Docker и контейнеризация"),

  h2("Проблема: «у меня работает»"),
  p(run("Классическая история: разработчик пишет код, у него работает. Передаёт коллеге или деплоит на сервер — падает. Причина: разные версии .NET, разные переменные среды, разные зависимости.")),
  p(run("Нужен способ упаковать "), bold("приложение вместе со всем окружением"), run(".")),

  h2("Что такое контейнер"),
  p(bold("Контейнер"), run(" — это изолированный процесс, который видит только своё окружение: свою файловую систему, свои переменные среды, свои сетевые интерфейсы. Внутри есть всё необходимое для запуска приложения — runtime, зависимости, конфигурация.")),
  analogy("Морской контейнер. Стандартный металлический ящик 20 или 40 футов. Внутри — что угодно: апельсины, станки, одежда. Снаружи — всегда одинаковый интерфейс. Грузится на любой корабль, поезд, грузовик без изменений. Порт не знает, что внутри — он просто перемещает контейнер."),

  h2("Docker Image и Container"),
  p(bold("Image"), run(" — это шаблон (snapshot файловой системы с приложением). Неизменяемый.")),
  p(bold("Container"), run(" — запущенный экземпляр image. Из одного image можно запустить 10 контейнеров.")),

  h2("Dockerfile — рецепт сборки"),
  p(run("Dockerfile — это текстовый файл с инструкциями: возьми базовый образ, скопируй код, собери, укажи команду запуска. Каждая инструкция — слой в образе. Слои кэшируются: если код изменился, но зависимости те же — Docker не скачивает их заново.")),
  p(run("В проекте используется "), bold("multi-stage build"), run(": первый образ (sdk) собирает и компилирует код, второй образ (aspnet runtime, меньше) берёт только собранные бинарники. Итоговый образ — маленький, без компилятора.")),

  h2("Docker Compose"),
  p(run("Docker Compose — инструмент для запуска "), bold("нескольких контейнеров вместе"), run(". Один файл docker-compose.yml описывает все сервисы, их зависимости, переменные среды, порты и сети.")),
  p(run("Ключевые возможности в проекте:")),
  bulletRuns([bold("depends_on + healthcheck"), run(": postgres и rabbitmq должны быть healthy, прежде чем стартуют .NET-сервисы")]),
  bulletRuns([bold("Внутренняя сеть Docker"), run(": сервисы обращаются друг к другу по имени: rabbitmq, postgres, auth-service — без IP-адресов")]),
  bulletRuns([bold("Volumes"), run(": данные PostgreSQL хранятся в именованном volume — не теряются при перезапуске контейнера")]),

  inProject("Одна команда docker compose up --build собирает все 9 контейнеров (postgres, rabbitmq, jaeger, 4 .NET сервиса, frontend, nginx) и запускает их в правильном порядке."),
  separator(),

  // ── 6. Distributed Tracing ───────────────────────────────────────────────
  pageBreak(),
  h1("6. Distributed Tracing и OpenTelemetry"),

  h2("Проблема"),
  p(run("В монолите, если что-то тормозит, можно добавить логи или воспользоваться профилировщиком — всё в одном процессе. В микросервисах запрос проходит через несколько сервисов: Gateway → Shortener → PostgreSQL. Если что-то медленно — где именно?")),
  p(run("Обычные логи не помогут: каждый сервис пишет свои логи, они не связаны между собой. Найти «какой запрос» среди тысяч строк — задача.")),

  h2("Что такое трейс"),
  p(bold("Trace"), run(" — это "), bold("полная история одного запроса"), run(" через все сервисы. Каждый трейс состоит из "), bold("span'ов"), run(".")),
  p(bold("Span"), run(" — один шаг в жизни запроса: обработка HTTP-запроса, SQL-запрос к БД, вызов другого сервиса. Span содержит:")),
  bullet("название операции"),
  bullet("время начала и длительность"),
  bullet("теги (метаданные: HTTP метод, статус код, имя таблицы)"),
  bullet("ссылку на родительский span"),

  analogy("Трекинг посылки. Посылка прошла: Москва → Екатеринбург → Новосибирск → доставлена. Каждый пункт — span со временем прибытия и отправки. Весь маршрут — trace. Трекинг-номер на коробке — TraceId."),

  h2("TraceId — связующая нить"),
  p(bold("TraceId"), run(" — уникальный идентификатор, который генерируется при первом запросе и "), bold("прокидывается во все сервисы"), run(" через HTTP-заголовок traceparent. Каждый сервис добавляет свои span'ы к этому трейсу. В итоге в Jaeger можно найти один TraceId и увидеть полную картину.")),

  h2("OpenTelemetry"),
  p(bold("OpenTelemetry"), run(" — это открытый стандарт (и набор библиотек) для сбора телеметрии: трейсов, метрик, логов. Ключевые преимущества:")),
  bulletRuns([bold("Vendor-neutral"), run(": один API, а куда отправить — настраивается. Сегодня Jaeger, завтра Grafana Tempo, послезавтра AWS X-Ray — код менять не нужно")]),
  bulletRuns([bold("Автоинструментация"), run(": достаточно добавить пакет OpenTelemetry.Instrumentation.AspNetCore — и все HTTP-запросы и ответы автоматически создают span'ы")]),

  h2("OTLP — протокол передачи"),
  p(bold("OTLP"), run(" (OpenTelemetry Protocol) — стандартный протокол для отправки телеметрии. Сервисы отправляют трейсы на порт 4317 (gRPC) контейнера Jaeger.")),
  p(run("Почему не старый "), bold("OpenTelemetry.Exporter.Jaeger"), run(": пакет официально deprecated. OTLP — это правильный современный путь, работающий с любым совместимым backend'ом.")),

  h2("Jaeger UI"),
  p(bold("Jaeger"), run(" — open-source система для хранения и визуализации трейсов (разработана Uber). В UI на http://localhost:16686 можно:")),
  bullet("Выбрать сервис и посмотреть все его трейсы"),
  bullet("Увидеть waterfall view: сколько времени занял каждый span"),
  bullet("Сравнить latency разных запросов"),
  bullet("Найти медленные SQL-запросы или узкие места"),

  inProject("Все 4 .NET сервиса инструментированы через AddAspNetCoreInstrumentation(). Трейсы отправляются через OTLP на jaeger:4317. В Jaeger видны сервисы: auth-service, shortener-service, redirector-service, analytics-service."),
  separator(),

  // ── 7. Health Checks ────────────────────────────────────────────────────
  pageBreak(),
  h1("7. Health Checks"),

  h2("Зачем нужны"),
  p(run("Как оркестратор (Kubernetes, Docker Swarm) узнаёт, жив ли сервис? Процесс может быть запущен, но приложение — в состоянии deadlock или не может подключиться к БД. Просто «процесс жив» недостаточно.")),
  p(run("Health Check — это HTTP-эндпоинт /health, который возвращает статус:")),
  bulletRuns([bold("200 Healthy"), run(" — всё в порядке")]),
  bulletRuns([bold("503 Unhealthy"), run(" — что-то сломано (БД недоступна, зависимость не отвечает)")]),

  h2("Liveness vs Readiness"),
  p(bold("Liveness"), run(" — «сервис жив и не завис». Если проверка не проходит — оркестратор перезапускает контейнер.")),
  p(bold("Readiness"), run(" — «сервис готов принимать трафик». Если не готов — балансировщик временно исключает его из ротации, но не перезапускает. Это важно при старте: сервис жив, но ещё выполняет миграции БД.")),

  h2("Health Checks в .NET"),
  p(run("ASP.NET Core имеет встроенный механизм health checks. В нашем проекте:")),
  p(run("builder.Services.AddHealthChecks().AddDbContextCheck<AppDbContext>() — регистрирует проверку, которая выполняет легковесный SQL-запрос к базе данных и убеждается, что соединение работает.")),
  p(run("app.MapHealthChecks(\"/health\") — подключает эндпоинт.")),

  h2("Как используется в продакшне"),
  p(run("В Kubernetes (стандарт для продакшн-оркестрации) каждый pod настраивается с livenessProbe и readinessProbe, которые периодически вызывают /health:")),
  bullet("livenessProbe упал 3 раза подряд → pod перезапускается"),
  bullet("readinessProbe упал → pod исключается из Service (балансировщика), трафик идёт только на здоровые поды"),
  p(run("Это обеспечивает "), bold("self-healing"), run(": система сама обнаруживает и устраняет проблемы без ручного вмешательства.")),

  inProject("Каждый из 4 .NET сервисов имеет /health с проверкой соединения к своей БД. В docker-compose healthcheck настроен для postgres и rabbitmq — .NET-сервисы не стартуют, пока инфраструктура не готова."),
  separator(),

  // ── 8. JWT ──────────────────────────────────────────────────────────────
  pageBreak(),
  h1("8. JWT — авторизация без состояния"),

  h2("Сессии vs токены"),
  p(bold("Сессионный подход (stateful):"), run(" при логине сервер создаёт сессию и сохраняет её в памяти или Redis, отдаёт клиенту cookie с session_id. При каждом запросе сервер ищет сессию в хранилище.")),
  p(run("Проблема в микросервисах: запрос может попасть в любой сервис. Если сессии хранятся в auth-service — каждый запрос должен идти через него. Это "), bold("единая точка отказа"), run(" и узкое место.")),
  p(bold("JWT-подход (stateless):"), run(" токен содержит всю информацию внутри себя. Любой сервис может проверить токен, зная только секретный ключ — без сетевых вызовов.")),

  h2("Структура JWT"),
  p(run("JWT (JSON Web Token) состоит из трёх частей, разделённых точкой:")),
  bulletRuns([bold("Header"), run(": алгоритм подписи (HS256) и тип токена. Base64-encoded.")]),
  bulletRuns([bold("Payload"), run(": claims — данные о пользователе: userId, email, время истечения (exp). Base64-encoded. НЕ зашифровано — видно всем, кто расшифрует Base64.")]),
  bulletRuns([bold("Signature"), run(": HMAC-подпись = sign(header + payload, secretKey). Гарантирует, что токен не был изменён.")]),

  analogy("Паспорт. Выдан государством (auth-service) один раз. Содержит данные о владельце (payload). Имеет защиту от подделки (подпись). Предъявляется везде — в аэропорту, банке, ГИБДД. Каждый проверяющий видит данные и проверяет подлинность сам, не звоня в паспортный стол."),

  h2("Почему JWT лучше для микросервисов"),
  bullet("Каждый сервис валидирует токен самостоятельно по общему секретному ключу"),
  bullet("Нет сетевых вызовов — нет зависимости от auth-service при обработке каждого запроса"),
  bullet("Горизонтальное масштабирование работает «из коробки» — все копии сервиса используют один ключ"),

  h2("Срок жизни и безопасность"),
  p(run("JWT нельзя «отозвать» досрочно без дополнительного хранилища. Поэтому "), bold("короткий срок жизни"), run(" критически важен. В проекте — 7 дней. В продакшне обычно: access token 15 минут + refresh token 30 дней.")),
  p(run("Payload виден всем (просто Base64) — никогда не кладите туда пароли или секретные данные.")),

  inProject("auth-service выдаёт JWT с userId и email в payload. shortener-service и analytics-service самостоятельно валидируют токен по общему Jwt:Key. userId извлекается из ClaimTypes.NameIdentifier."),
  separator(),

  // ── 9. Database per Service ─────────────────────────────────────────────
  pageBreak(),
  h1("9. Паттерн Database per Service"),

  h2("Почему нельзя одну БД на всех"),
  p(run("Интуитивный вопрос: зачем разные базы? Давайте все в одну Postgres — проще же. Вот почему это плохая идея:")),
  bulletRuns([bold("Схемная связность."), run(" Если shortener-service хочет переименовать колонку — нужно убедиться, что analytics-service тоже обновлён. Сервисы снова связаны.")]),
  bulletRuns([bold("Блокировки."), run(" Тяжёлый аналитический запрос может заблокировать таблицу и замедлить все операционные запросы.")]),
  bulletRuns([bold("Единая точка отказа."), run(" БД легла — упали все сервисы.")]),
  bulletRuns([bold("Нельзя масштабировать отдельно."), run(" Аналитика требует колоссальных ресурсов — но увеличить БД только для аналитики нельзя, если она общая.")]),
  bulletRuns([bold("Технологический монолит."), run(" Нельзя использовать Redis для кэша ссылок и MongoDB для аналитики — только одна БД.")]),

  h2("Как сервисы получают чужие данные"),
  p(run("Если у каждого своя БД — как сервис A узнаёт данные сервиса B?")),
  bulletRuns([bold("Через API."), run(" A делает HTTP-запрос к B: «дай мне данные пользователя X». Синхронно, но добавляет зависимость.")]),
  bulletRuns([bold("Через события."), run(" B публикует событие с данными → A слушает и сохраняет нужное в свою БД. Асинхронно, зато без прямой зависимости.")]),
  bulletRuns([bold("CQRS + Read Model."), run(" Сервис-читатель строит свою проекцию данных на основе событий. Именно это делает analytics-service: он не читает из чужой БД, он строит собственную модель UserStats на основе событий user.registered и link.created.")]),

  h2("Компромисс в проекте"),
  p(bold("redirector-service читает shortener_db"), run(" — это нарушение принципа. Оба сервиса используют одну базу shortener_db.")),
  p(run("Почему это сделано: для пет-проекта — упрощение. В продакшне правильное решение:")),
  bulletRuns([bold("Вариант 1."), run(" shortener-service публикует событие link.created с полным URL → redirector-service строит свою таблицу code→url.")]),
  bulletRuns([bold("Вариант 2."), run(" Redis-кэш: при создании ссылки shortener кладёт запись в Redis → redirector читает из Redis (быстро, без SQL).")]),
  bulletRuns([bold("Вариант 3."), run(" Совместить shortener и redirector в один сервис — они работают с одними данными, это один bounded context.")]),

  inProject("analytics-service — правильная реализация Database per Service: собственная БД analytics_db, собственная таблица UserStats, данные получает через RabbitMQ события, а не прямым SQL в чужую базу."),
  separator(),

  // ── 10. EDA ─────────────────────────────────────────────────────────────
  pageBreak(),
  h1("10. Event-Driven Architecture"),

  h2("Что это такое"),
  p(bold("Event-Driven Architecture (EDA)"), run(" — архитектурный стиль, при котором компоненты системы общаются через "), bold("события"), run(", а не через прямые вызовы. Событие — это факт того, что произошло: «пользователь зарегистрировался», «ссылка создана», «оплата прошла».")),
  p(run("Главное отличие от обычного RPC-вызова: при событии отправитель не ожидает ответа и не знает, кто будет его обрабатывать.")),

  h2("Слабая связность"),
  p(run("Это главное преимущество EDA. Рассмотрим пример: при регистрации пользователя нужно:")),
  bullet("создать профиль в analytics"),
  bullet("отправить приветственное письмо"),
  bullet("создать пустую корзину"),
  bullet("начислить бонусные баллы"),

  p(run("В синхронном подходе auth-service должен "), bold("знать про все эти сервисы"), run(" и вызывать каждый. Добавляем новый шаг — меняем auth-service.")),
  p(run("В EDA auth-service публикует одно событие user.registered и забывает. Каждый заинтересованный сервис сам подписывается. Добавляем бонусный сервис — auth-service не трогаем вообще.")),

  h2("Eventual Consistency"),
  p(run("Важная концепция EDA: "), bold("данные согласуются не мгновенно, а через некоторое время"), run(" (eventual consistency).")),
  p(run("Пример в проекте: пользователь зарегистрировался → auth-service сохранил в БД → опубликовал событие → analytics-service получил событие через 50мс → создал UserStats.")),
  p(run("В эти 50мс если запросить /api/stats/me — профиль ещё не создан. Это нормально и называется "), bold("eventual consistency"), run(": система "), italic("в конечном счёте"), run(" придёт в согласованное состояние.")),
  p(run("Это требует другого мышления при проектировании UI и бизнес-логики — нельзя рассчитывать на мгновенную согласованность после события.")),

  h2("Расширяемость без изменений"),
  p(run("Пример расширения нашего проекта без изменения существующего кода:")),
  bulletRuns([bold("Задача:"), run(" отправлять email при регистрации.")]),
  bulletRuns([bold("Решение:"), run(" создать email-service, подписать его на user.registered. auth-service, shortener-service, analytics-service — не трогать.")]),
  bulletRuns([bold("Задача:"), run(" уведомить в Telegram при создании ссылки.")]),
  bulletRuns([bold("Решение:"), run(" telegram-service подписывается на link.created. Ноль изменений в shortener-service.")]),
  p(run("Это "), bold("Open/Closed Principle"), run(" на уровне архитектуры: система открыта для расширения, закрыта для модификации.")),

  inProject("auth-service публикует user.registered и link.created через Topic Exchange «events». analytics-service подписывается через очереди analytics.user.registered и analytics.link.created. Если завтра добавить email-service — он создаёт свою очередь email.user.registered и биндит её к тому же exchange. Ни одна строка существующего кода не меняется."),

  separator(),

  // ── Заключение ───────────────────────────────────────────────────────────
  pageBreak(),
  h1("Итоги: технологии и их роль"),

  new Paragraph({
    spacing: { before: 120, after: 240 },
    children: [new TextRun({ text: "Как все технологии работают вместе в проекте:", size: 22, font: "Arial" })],
  }),

  bullet("Пользователь открывает браузер → запрос попадает на Nginx (Gateway)"),
  bullet("Nginx смотрит на путь и направляет в нужный .NET сервис"),
  bullet("Сервис берёт JWT из заголовка, валидирует его самостоятельно (без обращения к auth-service)"),
  bullet("Выполняет операцию, пишет в свою PostgreSQL базу"),
  bullet("Если нужно уведомить других — публикует событие в RabbitMQ (Topic Exchange)"),
  bullet("Analytics-service, подписанный на очередь, получает событие и обновляет свою БД"),
  bullet("Весь путь запроса записывается в трейс и отправляется в Jaeger через OTLP"),
  bullet("Каждый сервис отдаёт /health — сообщает о своём состоянии"),
  bullet("Весь стек поднимается одной командой docker compose up — благодаря Dockerfile и образам"),

  new Paragraph({
    spacing: { before: 300, after: 120 },
    children: [new TextRun({ text: "Каждая технология решает конкретную проблему:", bold: true, size: 22, font: "Arial" })],
  }),

  bulletRuns([bold("Микросервисы"), run(" → масштабируемость и изоляция")]),
  bulletRuns([bold("Nginx Gateway"), run(" → единая точка входа и безопасность")]),
  bulletRuns([bold("RabbitMQ"), run(" → слабая связность и надёжность")]),
  bulletRuns([bold("Docker"), run(" → воспроизводимость окружения")]),
  bulletRuns([bold("OpenTelemetry + Jaeger"), run(" → наблюдаемость (observability)")]),
  bulletRuns([bold("Health Checks"), run(" → self-healing и операционная готовность")]),
  bulletRuns([bold("JWT"), run(" → stateless авторизация в распределённой системе")]),
  bulletRuns([bold("Database per Service"), run(" → независимость и эволюция")]),
  bulletRuns([bold("Event-Driven Architecture"), run(" → расширяемость без модификации")]),

];

// ── document ────────────────────────────────────────────────────────────────

const doc = new Document({
  numbering: {
    config: [
      {
        reference: "bullets",
        levels: [
          {
            level: 0,
            format: LevelFormat.BULLET,
            text: "•",
            alignment: AlignmentType.LEFT,
            style: { paragraph: { indent: { left: 720, hanging: 360 } } },
          },
          {
            level: 1,
            format: LevelFormat.BULLET,
            text: "◦",
            alignment: AlignmentType.LEFT,
            style: { paragraph: { indent: { left: 1080, hanging: 360 } } },
          },
        ],
      },
    ],
  },
  styles: {
    default: {
      document: { run: { font: "Arial", size: 22 } },
    },
    paragraphStyles: [
      {
        id: "Heading1",
        name: "Heading 1",
        basedOn: "Normal",
        next: "Normal",
        quickFormat: true,
        run: { size: 32, bold: true, font: "Arial", color: "0F172A" },
        paragraph: { spacing: { before: 360, after: 160 }, outlineLevel: 0 },
      },
      {
        id: "Heading2",
        name: "Heading 2",
        basedOn: "Normal",
        next: "Normal",
        quickFormat: true,
        run: { size: 26, bold: true, font: "Arial", color: "1E3A5F" },
        paragraph: { spacing: { before: 240, after: 120 }, outlineLevel: 1 },
      },
    ],
  },
  sections: [
    {
      properties: {
        page: {
          size: { width: 11906, height: 16838 },
          margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 },
        },
      },
      footers: {
        default: new (await import("docx")).Footer({
          children: [
            new Paragraph({
              alignment: AlignmentType.CENTER,
              children: [
                new TextRun({ text: "URL Shortener — Теория · Стр. ", size: 18, font: "Arial", color: "94A3B8" }),
                new TextRun({ children: [PageNumber.CURRENT], size: 18, font: "Arial", color: "94A3B8" }),
              ],
            }),
          ],
        }),
      },
      children,
    },
  ],
});

const buffer = await Packer.toBuffer(doc);
writeFileSync("C:\\Users\\vitaliy.shaybekov\\source\\repos\\UrlShortener\\theory.docx", buffer);
console.log("Done: theory.docx");
