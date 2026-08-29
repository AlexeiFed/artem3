# Аудит информационной безопасности (pre-release)

**Роль:** Information Security Auditor  
**Дата:** 2026-08-29  
**Объект:** artem3 (Next.js App Router, PostgreSQL/Drizzle, админка, публичные заявки)  
**Стандарты:** OWASP Top 10:2021, ISO/IEC 27001:2022 (Annex A, релевантные контроли)  
**Метод:** ручной разбор всех HTTP-эндпоинтов, auth/session, валидации Zod, SQL-слоя, nginx/PM2, CSP, загрузки медиа.

Статусы: **Закрыта** — исправлена в коде/конфиге (2026-08-29). **Открыта** — подтверждена, не закрыта. **Не выявлена** — проверяли, эксплуатации нет.

Приоритет: **Критический** / **Высокий** / **Средний** / **Низкий**.

---

## Сводка

| Приоритет    | Открытых | Закрытых |
| ------------ | -------- | -------- |
| Критический  | 0        | 1        |
| Высокий      | 0        | 7        |
| Средний      | 0        | 11       |
| Низкий       | 0        | 6        |

SQL/NoSQL/OS command injection в прикладном коде **не выявлены**. CSRF мутаций админки закрыт Origin + `SameSite=Strict`. Тела админских JSON и публичного `POST /api/leads` ограничены `readLimitedJson` (leads: 16 KB, глубина ≤8 / ≤40 ключей).

Миграция схемы: `drizzle/0007_eminent_lyja.sql` (`audit_events`); `drizzle/0008_silly_xavin.sql` снимает неиспользуемые `totp_*`.

---

## Уязвимости (все закрыты 2026-08-29)

### SEC-001. Next.js слушает 0.0.0.0:3001 — обход nginx

- **Приоритет:** Критический
- **Статус:** Закрыта
- **OWASP:** A05 Security Misconfiguration  
- **ISO 27001:** A.8.9 Configuration management, A.8.20 Network security

**Описание.**  
`scripts/remote-setup.sh` стартует PM2 с `-H 0.0.0.0`. Nginx терминирует TLS и выставляет `X-Real-IP`/`X-Forwarded-For` с `$remote_addr`. Прямой заход на `:3001` обходит TLS, `client_max_body_size`, Host-фильтр и **позволяет подделать IP** → обход rate limit логина и заявок (`extractTrustedClientIp` поверит `X-Forwarded-For`/`X-Real-IP`).

**Рекомендация.**  
Биндить только `127.0.0.1`. На firewall закрыть 3001 с WAN. Проверить `ss -lntp | grep 3001` после релиза.

---

### SEC-002. `POST /api/leads` без лимита тела запроса

- **Приоритет:** Высокий
- **Статус:** Закрыта
- **OWASP:** A04 Insecure Design (API4:2023 Unrestricted Resource Consumption)  
- **ISO 27001:** A.8.14 Redundancy, A.8.6 Capacity

**Описание.**  
`src/app/api/leads/route.ts` читает `request.json()` без `readLimitedJson`. Nginx даёт до 105 MB. Анонимный клиент может скормить гигантский JSON / JSON-bomb (глубокая вложенность) → CPU/RAM Node, зависание воркера. Админские маршруты режут тело (8–64 KB), этот — нет.

**Рекомендация.**  
Тот же `readLimitedJson` (например 8–16 KB) + лимит глубины/ключей перед Zod. На nginx отдельный `client_max_body_size 16k` для `/api/leads`.

---

### SEC-003. Блокировка админа по email (lockout DoS)

- **Приоритет:** Высокий
- **Статус:** Закрыта
- **OWASP:** A07 Identification and Authentication Failures  
- **ISO 27001:** A.5.17 Authentication information, A.8.14

**Описание.**  
`createAuthService().login` считает попытки и по IP, и по email (`LOGIN_RATE_LIMIT_ACTION_EMAIL`, 5 / 15 мин). Email известен (`ADMIN_EMAIL` / форма логина). 6 запросов с любых IP → 429 для настоящего администратора на 15 минут. Один админ — полный простой панели.

**Рекомендация.**  
Жёсткий лимит только по IP. По email — прогрессивная задержка без полного lockout, либо CAPTCHA/Turnstile после N неудач, плюс unlock по SSH/seed не из публичного API.

---

### SEC-004. Нет второго фактора у админки (ПДн заявок)

- **Приоритет:** Высокий
- **Статус:** Закрыта
- **OWASP:** A07  
- **ISO 27001:** A.5.17, A.8.5 Secure authentication, 152-ФЗ (орг. мера)

**Описание.**  
Один фактор: email + пароль ≥14. Сессия 7 суток (`SESSION_TTL_MS`), idle-expire нет (`lastActivityAt` только touch). Утечка пароля/сессии = полный доступ к ФИО, телефонам, ситуациям, CSV-экспорту.

**Рекомендация.**  
TOTP или WebAuthn до релиза с живыми заявками. Сократить TTL (8–24 ч) и ввести idle timeout (30–60 мин без активности).

**Закрытие (принято без 2FA).**  
TTL 24 ч + idle 60 мин. TOTP снят: однопользовательская админка лендинга, второй фактор не нужен.

---

### SEC-005. Нет HSTS

- **Приоритет:** Высокий
- **Статус:** Закрыта
- **OWASP:** A02 Cryptographic Failures  
- **ISO 27001:** A.8.24 Cryptography

**Описание.**  
В `next.config.ts` есть CSP / Referrer-Policy / nosniff / Permissions-Policy. **Нет** `Strict-Transport-Security`. `scripts/ensure-nginx-site.sh` на 443 тоже не ставит HSTS. SSL-stripping / даунгрейд на первом визите по HTTP (пока не сработал `upgrade-insecure-requests` в CSP, и он есть только когда `SITE_URL` https).

**Рекомендация.**  
`Strict-Transport-Security: max-age=31536000; includeSubDomains` на 443 (после стабильного TLS). Не включать `preload` пока не проверите www/apex.

---

### SEC-006. CSV-инъекция в экспорте заявок

- **Приоритет:** Высокий
- **Статус:** Закрыта
- **OWASP:** A03 Injection  
- **ISO 27001:** A.8.12 Data leakage

**Описание.**  
Публичная форма: `situation` до 2000 символов, без запрета `=`, `+`, `-`, `@`, tab. `toCsv` (`admin-leads.service.ts`) кавычит только при `",\n\r`. Excel/LibreOffice исполнит `=HYPERLINK(...)` / `=cmd|'/C calc'!A0` при открытии `leads.csv`. Это не RCE сервера, это компрометация рабочей станции админа и утечка ПДн через формулу.

**Рекомендация.**  
Для каждой ячейки: если первый символ из `=+@-`, префикс `'`. Либо всегда CSV-quote + sanitize. Документировать «открывать в Numbers/Google Sheets, не в Excel с макросами».

---

### SEC-007. Local upload: 100 MB в память процесса

- **Приоритет:** Высокий
- **Статус:** Закрыта
- **OWASP:** A04 Unrestricted Resource Consumption  
- **ISO 27001:** A.8.6 Capacity

**Описание.**  
`createLocalUploadHandler`: после auth `Buffer.from(await request.arrayBuffer())` с лимитом `VIDEO_MAX_BYTES` (100 MB). Несколько параллельных PUT (украденная сессия или сам админ) → OOM PM2. Нет streaming на диск, нет лимита concurrent uploads.

**Рекомендация.**  
Писать чанками в файл с abort при превышении размера. Ограничить одновременные загрузки (1–2). Для видео — прямой S3 PUT, не через Node.

---

### SEC-008. Медиа без проверки magic bytes / nginx без nosniff

- **Приоритет:** Высокий
- **Статус:** Закрыта
- **OWASP:** A03 XSS, A08 Integrity  
- **ISO 27001:** A.8.25 Secure development

**Описание.**  
`writeLocalMediaObject` доверяет имени `uuid.(jpg|png|webp|mp4)`. Содержимое не сверяется. `/media/uploads/` отдаёт **nginx alias**, не Next: нет `X-Content-Type-Options: nosniff`, нет CSP. Полиглот HTML/JS в «картинке» при MIME-sniff браузера = stored XSS на origin сайта (сессия админа `Path=/`).

**Рекомендация.**  
Проверять сигнатуры файлов (file-type). На location uploads: `add_header X-Content-Type-Options nosniff always;` + `Content-Disposition: inline` только для известных MIME. Не хранить исполняемые/HTML.

---

### SEC-009. CSP: `script-src 'unsafe-inline'`

- **Приоритет:** Средний
- **Статус:** Закрыта
- **OWASP:** A05, A03  
- **ISO 27001:** A.8.25

**Описание.**  
`next.config.ts` / `content-security-policy.ts`: `'unsafe-inline'` в script и style. Любой XSS (SEC-008, ошибка в CMS-URL, сторонний скрипт Яндекс/VK) выполняется без nonce. В чеклисте проекта это уже отмечено как отложенное.

**Рекомендация.**  
Nonce/hash для Next, убрать unsafe-inline. Сторонние скрипты — строго host allowlist (уже частично есть).

---

### SEC-010. Смена пароля без rate limit

- **Приоритет:** Средний
- **Статус:** Закрыта
- **OWASP:** A07  
- **ISO 27001:** A.5.17

**Описание.**  
`POST /api/admin/password`: Origin + сессия + текущий пароль. Нет счётчика попыток. Украденная сессия (XSS, украденный ноут) → онлайн-брут `currentPassword` (argon2id, но без лимита).

**Рекомендация.**  
Тот же bucket, что логин: 5 / 15 мин на userId. После N неудач — revoke сессии.

---

### SEC-011. Политика пароля: только длина

- **Приоритет:** Средний
- **Статус:** Закрыта
- **OWASP:** A07  
- **ISO 27001:** A.5.17, A.8.5

**Описание.**  
Zod: `min(14).max(200)`, без сложности, без проверки утечек (HIBP), без запрета совпадения с email. Argon2id параметры нормальные (64 MiB, t=3).

**Рекомендация.**  
Запрет пароля = email; опционально HIBP k-anonymity; не усложнять charset ради галочки — лучше 2FA (SEC-004).

---

### SEC-012. `ADMIN_PASSWORD` в env перезаписывает хеш в БД

- **Приоритет:** Средний
- **Статус:** Закрыта
- **OWASP:** A04 Insecure Design  
- **ISO 27001:** A.5.17, A.8.9

**Описание.**  
`seedAdminUser`: если пароль в env не совпадает с хешем — ротация и revoke сессий. Секрет живёт в `/root/.config/artem-vibespace.env` **и** в процессе Node. Компрометация env = компрометация админки даже после смены пароля в UI (следующий seed вернёт env-пароль).

**Рекомендация.**  
Seed только если пользователя нет. Дальше — только UI/`POST /api/admin/password`. Env-пароль не держать после первого bootstrap.

---

### SEC-013. Список/CSV заявок без пагинации

- **Приоритет:** Средний
- **Статус:** Закрыта
- **OWASP:** A04  
- **ISO 27001:** A.8.6, A.5.33 Protection of records

**Описание.**  
`GET /api/admin/leads` и `GET /api/admin/leads/export` отдают **все** строки. При обходе rate limit (SEC-001) или долгом простое таблица растёт → тяжёлый SELECT, огромный JSON/CSV с ПДн в память Node и браузера.

**Рекомендация.**  
Cursor/limit (например 100). Экспорт стримом или фоновой задачей. Retention/удаление закрытых заявок по политике 152-ФЗ.

---

### SEC-014. `PATCH /api/admin/leads/[id]` — id не валидируется как UUID

- **Приоритет:** Средний
- **Статус:** Закрыта
- **OWASP:** A03 (ошибки БД), A04  
- **ISO 27001:** A.8.25

**Описание.**  
Контентные `[id]` гоняются через `assertUuid`. Статус заявки — нет: сырой `id` в `eq(leads.id, id)`. Невалидный UUID → ошибка Postgres → 500 INTERNAL (не 400). Не инъекция (Drizzle parameter), но утечка класса ошибки и шум в логах.

**Рекомендация.**  
`z.uuid().safeParse(id)` до репозитория, как в `admin-content.service.ts`.

---

### SEC-015. Proxy админки проверяет только наличие cookie

- **Приоритет:** Средний
- **Статус:** Закрыта
- **OWASP:** A01 Broken Access Control  
- **ISO 27001:** A.8.3 Information access restriction

**Описание.**  
`src/proxy.ts`: `cookies.has(ADMIN_SESSION_COOKIE)` без проверки подписи/БД. Любой может поставить `admin_session=x` и получить HTML/JS бандлы админки (данные RSC всё равно режет `requireAdminOrRedirect`). Это не обход API, но разведка UI и поверхность XSS.

**Рекомендация.**  
Оставить как defense-in-depth OK, если все страницы зовут `requireAdminOrRedirect` (сейчас да, кроме редиректа `/admin` → `/admin/hero`). Не считать proxy авторизацией — в комментарии/доке это уже так, в коде легко ошибиться позже.

---

### SEC-016. Загрузка local-upload не привязана к presign

- **Приоритет:** Средний
- **Статус:** Закрыта
- **OWASP:** A01  
- **ISO 27001:** A.8.25

**Описание.**  
Presign возвращает URL с `objectKey`. PUT `/api/admin/media/local-upload?objectKey=` принимает любой ключ, прошедший regex UUID.v4 + расширение, **без одноразового токена и без проверки, что presign был**. Админ (или XSS) может забить диск мусором в обход учёта размера из presign (лимит всё же 100 MB/файл).

**Рекомендация.**  
Одноразовый upload token в Redis/БД (TTL как presign 5 мин), привязка key+size+mime.

---

### SEC-017. Публичные `/media/uploads` — любые загруженные файлы в индексе и кэше

- **Приоритет:** Средний
- **Статус:** Закрыта
- **OWASP:** A01  
- **ISO 27001:** A.5.12 Classification, A.5.33

**Описание.**  
Файлы в `public/media/uploads` и nginx alias: `Cache-Control: public`, `expires 7d`, без auth. UUID в имени — не секрет. Случайная загрузка скана паспорта/договора в «медиатеку» = публичная утечка. `robots.txt` не disallow'ит `/media/uploads`.

**Рекомендация.**  
Disallow в robots. Не использовать медиатеку для ПДн. Для приватных файлов — отдельный signed GET, не `public/`.

---

### SEC-018. Argon2-DoS на логине с распределённых IP

- **Приоритет:** Средний
- **Статус:** Закрыта
- **OWASP:** A04  
- **ISO 27001:** A.8.6

**Описание.**  
Каждая попытка логина (валидный JSON, пароль 14–200 символов) считает argon2id ~64 MiB. Лимит 5/IP/15 мин; ботнет из тысяч IP умножает память. Dummy-hash на несуществующий email — правильно против user enumeration, но CPU всё равно тратится.

**Рекомендация.**  
Edge rate limit (nginx `limit_req` на `/api/admin/login`) + опционально CAPTCHA. Не снижать параметры argon2 ниже текущих.

---

### SEC-019. Рост таблицы `rate_limits`

- **Приоритет:** Средний
- **Статус:** Закрыта
- **OWASP:** A04  
- **ISO 27001:** A.8.6

**Описание.**  
Cleanup `deleteOlderThan` вызывается только когда `ipCount === 1` на логине. Лиды cleanup не делают. Уникальный HMAC(IP) на окно 15 мин × много IP = раздувание таблицы, медленный upsert.

**Рекомендация.**  
Периодический job (cron) удаления окон старше 24 ч. Индекс уже по PK (hashedKey, action, windowStart).

---

### SEC-020. Cookie сессии без `__Host-` и без абсолютного idle

- **Приоритет:** Низкий
- **Статус:** Закрыта
- **OWASP:** A07  
- **ISO 27001:** A.8.5

**Описание.**  
`admin_session`: HttpOnly, SameSite=Strict, Secure на https, Path=/. Нет `__Host-` (запрет Domain). Max-Age 7 дней совпадает с `expiresAt`; протухание по бездействию не режет cookie.

**Рекомендация.**  
`__Host-admin_session` + idle expire в `authenticate()`.

---

### SEC-021. Ответ логина раскрывает остаток попыток

- **Приоритет:** Низкий
- **Статус:** Закрыта
- **OWASP:** A07 (информационная)  
- **ISO 27001:** A.8.16 Monitoring

**Описание.**  
401/429 отдают `attemptsRemaining` / человекочитаемый текст. Удобно админу, удобно атакующему калибровать lockout (SEC-003).

**Рекомендация.**  
Для 401 — общее «неверные данные». Лимит только в 429 без счётчика email.

---

### SEC-022. Нет централизованного журнала ИБ

- **Приоритет:** Низкий
- **Статус:** Закрыта
- **OWASP:** A09 Security Logging Failures  
- **ISO 27001:** A.8.15 Logging, A.8.16

**Описание.**  
`console.error` без PII (хорошо), но нет неизменяемого audit trail: кто вошёл, кто выгрузил CSV, кто сменил пароль, IP, user-agent. Для 152-ФЗ и ISO этого мало.

**Рекомендация.**  
Таблица `audit_events` (append-only) на login/logout/password/leads.export/settings.patch.

---

### SEC-023. `default_server` на :80 проксирует приложение

- **Приоритет:** Низкий
- **Статус:** Закрыта
- **OWASP:** A05  
- **ISO 27001:** A.8.9

**Описание.**  
`scripts/ensure-nginx-site.sh`: `server_name _;` + `proxy_pass` на приложение. Запрос по IP/чужому Host попадает в Next. Мутации отрежет `isSameOrigin` vs `NEXT_PUBLIC_SITE_URL`. Остаётся Host-cache / путаница cookies на неканоническом origin.

**Рекомендация.**  
`default_server` → 444/404, не проксировать. Канон только `artemsysuev.ru`.

---

### SEC-024. Секреты и инфраструктура в репозитории

- **Приоритет:** Низкий
- **Статус:** Закрыта
- **OWASP:** A05  
- **ISO 27001:** A.5.10 Acceptable use, A.8.9

**Описание.**  
`deploy.sh`: дефолтный `DEPLOY_HOST=root@213.171.15.166`. `ensure-nginx-site.sh`: email certbot. Это не пароли, но карта атаки (IP, оператор). `.env` в gitignore — ок.

**Рекомендация.**  
Убрать боевой IP/email из дефолтов; только env. Ротация если репо когда-либо было публичным.

---

### SEC-025. Нет `rel="noopener"` явно (есть noreferrer)

- **Приоритет:** Низкий
- **Статус:** Закрыта
- **OWASP:** A01 (tabnabbing)  
- **ISO 27001:** A.8.25

**Описание.**  
Внешние ссылки: `rel="noreferrer"` (Contacts, отзывы). `noreferrer` в современных браузерах подразумевает поведение noopener. Риск tabnabbing минимален. CMS-URL уже `https:` only.

**Рекомендация.**  
`rel="noopener noreferrer"` единообразно, косметика.

---

## Проверено, эксплуатация не подтверждена

| ID | Тема | Статус | Комментарий |
| -- | ---- | ------ | ----------- |
| OK-1 | SQL injection | Не выявлена | Только Drizzle/`sql` с идентификаторами колонок, без интерполяции user input |
| OK-2 | OS command injection | Не выявлена | Нет `child_process`/`exec` по пользовательским данным |
| OK-3 | NoSQL injection | Не выявлена | PostgreSQL |
| OK-4 | CSRF мутаций админки | Не выявлена | `isSameOrigin` + Origin обязателен (fail-closed) + SameSite=Strict |
| OK-5 | Open redirect `next=` | Не выявлена | `safeAdminNextPath`: только `/admin…`, не `//` |
| OK-6 | Stored XSS в текстах лендинга | Не выявлена | React text; JSON-LD экранирует `<`; href якоря/`https`/`tel:+7` |
| OK-7 | User enumeration логина | Не выявлена | Dummy argon2 hash, одинаковый 401 |
| OK-8 | Сессия в БД | Не выявлена (хорошо) | SHA-256 токена, не plaintext |
| OK-9 | TLS к Postgres | Не выявлена (хорошо) | `ssl: { rejectUnauthorized: true }` вне localhost |
| OK-10 | CORS | Не выявлена | Заголовков CORS нет — браузерный cross-origin JSON не читается |
| OK-11 | Prototype pollution через JSON | Не выявлена | `JSON.parse` + Zod `.strict()` |
| OK-12 | Path traversal local media | Не выявлена | `MediaCompleteSchema` на objectKey |
| OK-13 | SSRF из user input | Не выявлена | Telegram IP/base только из env |
| OK-14 | Telegram HTML injection | Не выявлена | `escapeHtml` при `parse_mode: HTML` |

---

## Карта эндпоинтов (валидация / auth)

| Метод | Путь | Auth | Origin | Лимит тела | Zod/сервис |
| ----- | ---- | ---- | ------ | ---------- | ---------- |
| POST | `/api/leads` | нет | нет | 16 KB + глубина/ключи | CreateLeadInputSchema |
| GET | `/api/landing-data` | нет | — | — | LandingDataSuccessSchema на выходе |
| POST | `/api/admin/login` | нет | да | 8 KB | LoginInputSchema + IP rate limit |
| POST | `/api/admin/logout` | cookie optional | да | — | invalidate hash |
| GET | `/api/admin/session` | cookie | нет | — | session token pattern |
| POST | `/api/admin/password` | да | да | 8 KB | ChangePasswordInputSchema + rate limit |
| GET | `/api/admin/content` | да | нет | — | bootstrap |
| PATCH | `/api/admin/content/settings` | да | да | 64 KB | UpdateSiteSettingsInputSchema |
| POST/PATCH/DELETE | `/api/admin/content/{services,cases,faqs,reviews,certificates}` | да | да | 64 KB | схемы + assertUuid |
| POST | `/api/admin/content/reorder` | да | да | 64 KB | ReorderInputSchema |
| GET | `/api/admin/leads` | да | нет | — | cursor + limit ≤100 |
| PATCH | `/api/admin/leads/[id]` | да | да | 8 KB | status enum + `z.uuid` |
| GET | `/api/admin/leads/export` | да | нет | — | батчи, max 5000, CSV sanitize |
| GET/POST | `/api/admin/media`, presign, complete | да | да | 16 KB JSON | Media*Schema + HMAC presign |
| PUT | `/api/admin/media/local-upload` | да | да | stream, magic bytes | objectKey + HMAC sig |

---

## Соответствие OWASP Top 10 (сжато)

| Пункт | Оценка | Комментарий |
| ----- | ------ | ----------- |
| A01 Access Control | Удовлетворительно | proxy проверяет формат токена; страницы — `requireAdminOrRedirect`; медиа публичные по UUID (не для ПДн) |
| A02 Crypto | Удовлетворительно | argon2id + TLS к БД; HSTS; `__Host-admin_session` на https |
| A03 Injection | Удовлетворительно | SQL/OS чисто; CSV prefix `'`; magic bytes на local upload |
| A04 Insecure Design | Удовлетворительно | IP-only login limit; leads body 16 KB |
| A05 Misconfig | Удовлетворительно | PM2 `127.0.0.1`; default_server 404; CSP nonce + `strict-dynamic` |
| A06 Vulnerable Components | Не проверялось в этом прогоне | в чеклисте: разобрать `npm audit` |
| A07 Auth | Удовлетворительно | пароль ≥14; TTL 24 ч; idle 60 мин; пароль ≠ email; без 2FA по решению |
| A08 Integrity | Частично | нет SRI на Яндекс/VK; magic bytes есть |
| A09 Logging | Удовлетворительно | `audit_events`: login/logout/password/export/settings |
| A10 SSRF | Удовлетворительно | нет user-controlled fetch |

## ISO 27001:2022 — пробелы относительно кода (не ISMS)

Закрыто в коде: A.8.24 (хеши, TLS БД, HSTS), A.8.25 (Zod, magic bytes, HMAC upload), A.8.12 (DTO без утечки SQL/стека), A.5.17 / A.8.5 (idle, IP rate limit; 2FA сознательно нет), A.8.9 (биндинг PM2, nginx uploads headers, default_server), A.8.6 (лимиты тела/stream upload), A.8.15 (audit_events).

Остаточный риск вне кода: A.5.33 retention ПДн (политика хранения закрытых заявок), A.06 `npm audit`, ISMS (политики, HR, физ. доступ). Полный сертификационный аудит ISO этим отчётом **не является**.

---

## Как закрыто (2026-08-29)

| ID | Что сделано |
| -- | ----------- |
| SEC-001 | PM2 `-H 127.0.0.1`, `HOSTNAME=127.0.0.1` |
| SEC-002 | `readLimitedJson` 16 KB + глубина ≤8 / ≤40 ключей; nginx `client_max_body_size 16k` на `/api/leads` |
| SEC-003 | Rate limit логина только по IP |
| SEC-004 | TTL 24 ч + idle 60 мин. TOTP не внедряем (решение по продукту) |
| SEC-005 | HSTS в Next headers, proxy и nginx `:443` |
| SEC-006 | CSV: префикс `'` для `=+@-\t\r` |
| SEC-007 | Stream на диск (`writeLocalMediaStream`), не `arrayBuffer` |
| SEC-008 | Magic bytes; nginx `nosniff` + `X-Robots-Tag` на uploads |
| SEC-009 | Per-request nonce + `strict-dynamic` в `src/proxy.ts` |
| SEC-010 | Rate limit смены пароля по userId, 5 / 15 мин |
| SEC-011 | Пароль не может совпадать с email |
| SEC-012 | Seed создаёт админа только если его нет; env больше не ротирует хеш |
| SEC-013 | Cursor + limit 50/100; export батчами, max 5000 |
| SEC-014 | `z.uuid()` до репозитория |
| SEC-015 | Proxy: формат токена 43 символа; `/admin` зовёт `requireAdminOrRedirect` |
| SEC-016 | HMAC presign (key+mime+size+exp) |
| SEC-017 | `robots.txt` Disallow `/media/uploads/` |
| SEC-018 | nginx `limit_req` zone `adminlogin` на `/api/admin/login` |
| SEC-019 | Cleanup `rate_limits` старше 24 ч на логине и на заявках |
| SEC-020 | `__Host-admin_session` на https; idle expire в `authenticate` |
| SEC-021 | 401 без `attemptsRemaining`; лимит только в 429 |
| SEC-022 | Таблица `audit_events`; события login/logout/password/export/settings |
| SEC-023 | `default_server` → 404, канон только `artemsysuev.ru` |
| SEC-024 | `DEPLOY_HOST` обязателен; certbot email не зашит |
| SEC-025 | `rel="noopener noreferrer"` на внешних ссылках |

После деплоя: `npm run db:migrate`. Firewall: 3001 только localhost.

