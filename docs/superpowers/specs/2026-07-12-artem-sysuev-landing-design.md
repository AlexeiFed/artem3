# Лендинг и админ-панель Артёма Сысуева — дизайн системы

Дата: 12 июля 2026  
Статус: согласованный дизайн перед планированием реализации

## 1. Цель и границы

Создать одностраничный премиальный лендинг семейного и имущественного юриста Артёма Сысуева в Хабаровске и собственную защищённую админ-панель. Приложение разворачивается единым Next.js-сервисом в Timeweb Cloud, использует PostgreSQL и Timeweb S3 Object Storage.

Первая версия содержит реалистичные seed-данные. Контакты, тексты, цены, ссылки, отзывы, сертификаты, FAQ, кейсы и медиа полностью редактируются через `/admin`.

Вместо отсутствующего видео Артёма используется нейтральный локальный cinematic loop без лиц. После сохранения VK embed в админке VK Video получает приоритет без изменения размеров hero.

## 2. Технологический стек

- Next.js App Router, TypeScript strict mode.
- Tailwind CSS, CSS variables и единый `src/lib/design-tokens.ts`.
- Framer Motion для композиционных и state-анимаций.
- Актуальный пакет `lenis`, заменивший устаревший `@studio-freight/lenis`.
- PostgreSQL через `DATABASE_URL`.
- Drizzle ORM для схемы и миграций, `postgres.js` для соединения.
- Zod для runtime-валидации API и форм.
- Argon2id для паролей.
- S3-compatible client для Timeweb Object Storage.
- Vitest, React Testing Library и Playwright.

## 3. Архитектура

Приложение — модульный монолит с route groups `(site)` и `(admin)`. Доменные модули:

- `content`: публичный контент и редактор;
- `leads`: формы, заявки и статусы;
- `auth`: пользователи и серверные сессии;
- `media`: presigned uploads и метаданные;
- `analytics`: безопасные клиентские события;
- `db`: схема, подключение, миграции и seed.

Публичная страница выполняет один серверный запрос к `/api/landing-data`. Route Handler собирает типизированный `LandingData`, а страница передаёт его секциям без клиентского waterfall. После админских изменений вызывается `revalidateTag`.

## 4. Данные

Нормализованные таблицы:

- `site_settings`: hero, trust banner, workflow, contacts, legal text, map, ratings, VK embed;
- `services`: slug, title, description, situations, trust note, price, high-value flag, sort order;
- `cases`: situation, action, result, sort order;
- `faqs`: question, answer, sort order;
- `reviews`: author, quote, image, source, source URL, sort order;
- `certificates`: title, image, alt text, sort order;
- `leads`: name, normalized phone, situation, service, status, timestamps;
- `admin_users`: email, Argon2id hash, active flag;
- `admin_sessions`: token hash, user, expiry, last activity;
- `media_assets`: object key, URL, MIME type, size, alt text;
- `rate_limits`: hashed key, action, window and count.

FAQ, кейсы, отзывы и сертификаты изменяются транзакционно. Порядок хранится в `sortOrder`; удаление и перестановка не оставляют дубликаты порядка.

## 5. Визуальная система

Выбрано направление **C — Cinematic Overlay**.

Hero использует полноэкранное видео с forest-gradient overlay. H1 раскрывается по словам. После hero страница возвращается к тёплой бумажной основе и редакционной композиции с большими полями.

Обязательные базовые токены:

- background `#FAFAF7`;
- text primary `#2B2B2B`;
- text secondary `#4A4741`;
- accent sage `#3B5942`;
- accent forest `#2F4A36`;
- display serif: Cormorant Garamond или Playfair Display;
- body sans: Inter с системным fallback.

`src/lib/design-tokens.ts` также определяет spacing, radii, shadows, typography scale, z-index и motion easing. Tailwind использует те же значения через CSS variables. Компоненты не содержат произвольных цветов.

## 6. Публичный лендинг

Порядок секций:

1. sticky header и полноэкранное mobile menu;
2. cinematic hero `#main`;
3. quick access grid;
4. «Рентген договора»;
5. услуги `#uslugi` со sticky tabs;
6. workflow insights;
7. honesty banner;
8. stacking cases `#cases`;
9. ratings, reviews и certificates `#reviews`;
10. FAQ `#faq`;
11. contacts, map, form и footer `#contacts`.

Все CTA открывают один `ModalForm`, смонтированный в layout. Имя услуги передаётся в модалку без навигации. После успешного POST форма заменяется success state внутри модалки. Затем вызывается:

`window.ym?.(Number(process.env.NEXT_PUBLIC_YANDEX_METRIKA_ID), "reachGoal", "lead_success")`.

Floating contact widget и scroll-to-top располагаются в одной вертикальной группе. Arrow появляется после 400 px и прокручивает Lenis к `#main`.

## 7. Интерактивность и производительность

- Lenis синхронизируется с requestAnimationFrame.
- Scroll-linked значения обновляют MotionValue, а не React state.
- Flashlight использует два слоя документа и radial CSS mask.
- Stacking cases используют CSS sticky; Framer Motion уменьшает предыдущие карты через `useScroll/useTransform`.
- Service tabs синхронизируются IntersectionObserver.
- Весы правосудия — собственный SVG: баланс при входе, наклон на hover карточки раздела имущества.
- Reviews используют desktop carousel и mobile scroll snap по одной карточке.
- FAQ использует `AnimatePresence`, height и opacity.
- Magnetic CTA включается только для fine pointer.
- Yandex Map динамически загружается при приближении к contacts.
- `prefers-reduced-motion` отключает Lenis, parallax, flashlight-follow и stacking scale.
- Анимации используют transform/opacity; большие backdrop-filter области запрещены.

VK iframe создаётся сразу после загрузки hero с preconnect. До готовности отображается стабильный poster или локальный loop. Muted autoplay запрашивается параметрами VK; включение звука выполняется только после пользовательского клика. Если API конкретного embed не поддерживает внешнее управление звуком, UI явно сообщает об ограничении.

## 8. Админ-панель

Навигация:

- Главная;
- Услуги;
- Кейсы;
- FAQ;
- Отзывы;
- Медиа;
- Контакты;
- Заявки.

Текстовые формы используют структурированные поля и явную кнопку сохранения. Интерфейс показывает dirty/saving/saved/error states. FAQ, кейсы, отзывы и сертификаты поддерживают добавление, редактирование, подтверждаемое удаление, drag-and-drop сортировку и preview.

Медиа загружаются напрямую в Timeweb S3 по короткоживущему presigned URL. После загрузки сервер проверяет метаданные и сохраняет asset. VK iframe принимается только с разрешённых VK-доменов.

Заявки имеют статусы «Новая», «В работе», «Закрыта» и экспортируются в CSV.

## 9. Авторизация и безопасность

Первый администратор создаётся idempotent seed-командой из `ADMIN_EMAIL` и `ADMIN_PASSWORD`. Пароль в исходниках отсутствует.

После входа создаётся случайный 256-bit session token. В cookie хранится исходный token, в PostgreSQL — только SHA-256 hash. Cookie: `HttpOnly`, `Secure` в production, `SameSite=Strict`, path `/`, срок семь дней.

Мутации требуют валидной серверной сессии и совпадения `Origin`. Login и lead endpoints ограничиваются rate limit. Production API не возвращает SQL, stack traces или secrets.

CSP разрешает только необходимые домены VK, Яндекс Карты/Метрики и Timeweb S3. `DATABASE_URL`, S3 secrets, session secret и password hash никогда не попадают в клиентский bundle.

## 10. API

Публичные endpoints:

- `GET /api/landing-data`;
- `POST /api/leads`.

Auth endpoints:

- `POST /api/admin/login`;
- `POST /api/admin/logout`;
- `GET /api/admin/session`.

Защищённые endpoints:

- CRUD `/api/admin/content/*`;
- CRUD/reorder для services, cases, FAQ, reviews и certificates;
- `POST /api/admin/media/presign`;
- `POST /api/admin/media/complete`;
- list/status/export для leads.

Все endpoints валидируют path, query и body через Zod и возвращают единый typed envelope. Некорректные поля возвращают адресуемые field errors.

## 11. Ошибки и устойчивость

Публичная страница показывает seed/fallback content при временной недоступности внешнего видео или карты. Ошибка отправки заявки сохраняет введённые данные и предлагает повторить запрос.

Админские optimistic updates откатываются при отказе API. Конфликтующие операции сериализуются транзакцией. S3 upload имеет progress, retry и удаление незавершённого объекта по lifecycle policy.

## 12. Проверка

Unit:

- Zod schemas;
- phone normalization;
- token hashing и expiry;
- content mapping;
- URL/domain allowlist.

Integration:

- repositories с тестовой PostgreSQL;
- login/session/logout;
- landing data;
- lead creation и rate limit;
- CRUD и reorder;
- media presign/complete.

Playwright:

- вход и защищённый redirect;
- CRUD FAQ и кейсов;
- lead modal success без redirect;
- mobile menu;
- service anchors;
- reduced motion smoke.

Перед релизом обязательны ESLint, TypeScript `--noEmit`, Vitest, production build и Playwright smoke.

## 13. Timeweb Cloud

Деплой выполняется standalone Docker image. Миграции запускаются отдельной deploy-командой до переключения трафика. Приложение предоставляет health endpoint, использует PostgreSQL SSL и получает конфигурацию только из ENV:

- `DATABASE_URL`;
- `SESSION_SECRET`;
- `ADMIN_EMAIL`;
- `ADMIN_PASSWORD`;
- `S3_ENDPOINT`;
- `S3_REGION`;
- `S3_BUCKET`;
- `S3_ACCESS_KEY_ID`;
- `S3_SECRET_ACCESS_KEY`;
- `NEXT_PUBLIC_SITE_URL`;
- `NEXT_PUBLIC_YANDEX_METRIKA_ID`.

## 14. Cursor Rules

Создаются:

- `.cursor/rules.md` — краткий индекс;
- `.cursor/rules/core-architecture.mdc` — всегда применяемые границы модулей;
- `.cursor/rules/design-system.mdc` — TSX/CSS/Tailwind и design tokens;
- `.cursor/rules/typescript-api-security.mdc` — strict TypeScript, Zod и auth;
- `.cursor/rules/database.mdc` — Drizzle, миграции и транзакции;
- `.cursor/rules/testing-verification.mdc` — обязательная проверка изменений.

Каждое правило содержит один предмет, конкретные glob-паттерны и остаётся коротким.

## 15. Не входят в первую версию

- сторонний headless CMS;
- несколько ролей и организаций;
- полноценная CRM;
- онлайн-оплата;
- Telegram/WhatsApp-бот;
- автоматическая публикация отзывов из Яндекс/2GIS;
- видеотранскодинг;
- мультиязычность.
