# Artem Sysuev Landing and Admin Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a production-ready animated legal landing page, PostgreSQL-backed content API, secure custom admin panel, S3 media workflow, and Timeweb deployment package.

**Architecture:** A single Next.js 16 App Router modular monolith separates site, admin, auth, content, leads, media, and database concerns. Route Handlers expose Zod-validated DTOs; Drizzle repositories own persistence; server-rendered pages consume one `/api/landing-data` payload.

**Tech Stack:** Next.js 16, React, TypeScript strict, Tailwind CSS 4, Motion for React, Lenis, Drizzle ORM, postgres.js, Zod, Argon2id, AWS S3 SDK, Vitest, React Testing Library, Playwright.

**Repository note:** The workspace is not a Git repository. This plan does not initialize Git or execute commits without explicit user authorization.

---

## File map

### Platform and conventions

- `package.json` — scripts and dependencies.
- `next.config.ts` — standalone build, CSP and image hosts.
- `src/app/globals.css` — Tailwind import, token variables, base styles.
- `src/lib/design-tokens.ts` — canonical typed visual tokens.
- `.cursor/rules.md` — project rule index.
- `.cursor/rules/*.mdc` — focused architecture, UI, API, DB and verification rules.

### Database and domain modules

- `src/db/schema/*.ts` — normalized PostgreSQL tables and enums.
- `src/db/client.ts` — server-only postgres.js and Drizzle client.
- `src/db/migrate.ts`, `src/db/seed.ts` — deployment migration and idempotent seed.
- `src/modules/content/*` — DTO, repository and landing-data composition.
- `src/modules/auth/*` — password hashing, session lifecycle and guards.
- `src/modules/leads/*` — lead validation, phone normalization and rate limit.
- `src/modules/media/*` — S3 allowlist, presigning and completion.

### Application routes

- `src/app/(site)/page.tsx` — one landing-data request and section composition.
- `src/app/(admin)/admin/*` — login, layout and editors.
- `src/app/api/landing-data/route.ts` — public landing payload.
- `src/app/api/leads/route.ts` — public lead creation.
- `src/app/api/admin/**/route.ts` — authenticated CRUD, media and lead operations.

### UI

- `src/components/site/*` — one focused component per landing section.
- `src/components/motion/*` — Lenis, reveal, magnetic and reduced-motion helpers.
- `src/components/forms/ModalForm.tsx` — global conversion modal.
- `src/components/admin/*` — admin shell, editors, sortable lists and media uploader.

### Verification and operations

- `src/**/*.test.ts(x)` — colocated unit/component tests.
- `tests/integration/*` — repository and Route Handler tests.
- `tests/e2e/*` — Playwright journeys.
- `Dockerfile`, `.dockerignore`, `docker-compose.yml` — local and Timeweb runtime.
- `.env.example`, `README.md` — required variables and exact commands.

---

### Task 1: Bootstrap the strict Next.js project and project rules

**Files:**
- Create: `package.json`
- Create: `tsconfig.json`
- Create: `next.config.ts`
- Create: `postcss.config.mjs`
- Create: `eslint.config.mjs`
- Create: `src/app/layout.tsx`
- Create: `src/app/globals.css`
- Create: `src/lib/design-tokens.ts`
- Create: `.cursor/rules.md`
- Create: `.cursor/rules/core-architecture.mdc`
- Create: `.cursor/rules/design-system.mdc`
- Create: `.cursor/rules/typescript-api-security.mdc`
- Create: `.cursor/rules/database.mdc`
- Create: `.cursor/rules/testing-verification.mdc`

- [ ] **Step 1: Create package scripts and install current stable packages**

Use scripts:

```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "eslint .",
    "typecheck": "tsc --noEmit",
    "test": "vitest run",
    "test:watch": "vitest",
    "test:e2e": "playwright test",
    "db:generate": "drizzle-kit generate",
    "db:migrate": "tsx src/db/migrate.ts",
    "db:seed": "tsx src/db/seed.ts"
  }
}
```

Run:

```bash
npm install next react react-dom motion lenis drizzle-orm postgres zod argon2 @aws-sdk/client-s3 @aws-sdk/s3-request-presigner @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities
npm install -D typescript @types/node @types/react @types/react-dom tailwindcss @tailwindcss/postcss eslint eslint-config-next drizzle-kit tsx vitest jsdom @testing-library/react @testing-library/jest-dom @playwright/test
```

Expected: `npm install` exits `0` and creates `package-lock.json`.

- [ ] **Step 2: Add strict compiler and Next.js configuration**

Set `strict`, `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`, alias `@/* -> ./src/*`, `output: "standalone"`, and response headers for CSP, Referrer-Policy, X-Content-Type-Options and Permissions-Policy.

- [ ] **Step 3: Define canonical tokens**

```ts
export const designTokens = {
  color: {
    background: "#FAFAF7",
    textPrimary: "#2B2B2B",
    textSecondary: "#4A4741",
    accentSage: "#3B5942",
    accentForest: "#2F4A36",
  },
  motion: {
    easeCinematic: [0.22, 1, 0.36, 1] as const,
    durationFast: 0.24,
    durationBase: 0.56,
    durationSlow: 0.9,
  },
  radius: { control: "999px", card: "1.5rem", panel: "2rem" },
  shadow: { lift: "0 24px 80px rgb(47 74 54 / 0.12)" },
} as const
```

- [ ] **Step 4: Create focused Cursor rules**

Rules enforce typed boundaries, design-token-only colors, server-only secrets, Zod at API boundaries, generated Drizzle migrations, TDD and verification commands. Keep each `.mdc` below 50 lines with exact globs.

- [ ] **Step 5: Verify bootstrap**

Run:

```bash
npm run typecheck && npm run lint && npm run build
```

Expected: all commands exit `0`; `/` may render a minimal shell.

---

### Task 2: Define environment validation and PostgreSQL schema

**Files:**
- Create: `.env.example`
- Create: `drizzle.config.ts`
- Create: `src/lib/env/server.ts`
- Create: `src/lib/env/public.ts`
- Create: `src/db/client.ts`
- Create: `src/db/schema/content.ts`
- Create: `src/db/schema/auth.ts`
- Create: `src/db/schema/leads.ts`
- Create: `src/db/schema/media.ts`
- Create: `src/db/schema/index.ts`
- Create: `src/db/schema/schema.test.ts`
- Create: `src/db/migrate.ts`

- [ ] **Step 1: Write failing schema contract tests**

```ts
import { describe, expect, it } from "vitest"
import { getTableColumns } from "drizzle-orm"
import { adminSessions, cases, faqs, services } from "@/db/schema"

describe("database schema", () => {
  it("stores ordered content and hashed sessions", () => {
    expect(getTableColumns(services)).toHaveProperty("sortOrder")
    expect(getTableColumns(cases)).toHaveProperty("sortOrder")
    expect(getTableColumns(faqs)).toHaveProperty("sortOrder")
    expect(getTableColumns(adminSessions)).toHaveProperty("tokenHash")
  })
})
```

- [ ] **Step 2: Run the test and confirm failure**

Run: `npm test -- src/db/schema/schema.test.ts`

Expected: FAIL because schema exports do not exist.

- [ ] **Step 3: Implement enums, tables, constraints and indexes**

Use UUID primary keys, timezone-aware timestamps, unique service slugs, unique admin emails, indexed lead status, unique `(entity, sortOrder)` ordering where applicable, JSONB string arrays for service situations, and cascading session deletion.

- [ ] **Step 4: Add validated server environment**

```ts
const serverEnvSchema = z.object({
  DATABASE_URL: z.string().url(),
  SESSION_SECRET: z.string().min(32),
  ADMIN_EMAIL: z.string().email(),
  ADMIN_PASSWORD: z.string().min(14),
  S3_ENDPOINT: z.string().url(),
  S3_REGION: z.string().min(1),
  S3_BUCKET: z.string().min(1),
  S3_ACCESS_KEY_ID: z.string().min(1),
  S3_SECRET_ACCESS_KEY: z.string().min(1),
})
```

Parse lazily inside server-only modules so `next build` can compile without production secrets.

- [ ] **Step 5: Generate and inspect migration**

Run:

```bash
npm run db:generate -- --name=initial_schema
```

Expected: SQL migration creates all tables, enums, foreign keys and indexes without destructive statements.

- [ ] **Step 6: Run tests**

Run: `npm test -- src/db/schema/schema.test.ts`

Expected: PASS.

---

### Task 3: Build seed data, typed content repository and landing API

**Files:**
- Create: `src/modules/content/content.schemas.ts`
- Create: `src/modules/content/content.types.ts`
- Create: `src/modules/content/content.repository.ts`
- Create: `src/modules/content/landing-data.service.ts`
- Create: `src/modules/content/landing-data.service.test.ts`
- Create: `src/db/seed-data.ts`
- Create: `src/db/seed.ts`
- Create: `src/app/api/landing-data/route.ts`
- Create: `src/app/api/landing-data/route.test.ts`

- [ ] **Step 1: Write failing mapping test**

```ts
it("returns services, cases and faqs in stable order", async () => {
  const data = await buildLandingData(fakeRepository)
  expect(data.services.map((item) => item.slug)).toEqual([
    "razvod", "alimenty", "imushchestvo", "deti", "zemlya", "uslugi",
  ])
  expect(data.cases).toHaveLength(4)
  expect(data.faqs.length).toBeGreaterThanOrEqual(6)
})
```

- [ ] **Step 2: Run and confirm failure**

Run: `npm test -- src/modules/content/landing-data.service.test.ts`

Expected: FAIL because `buildLandingData` is absent.

- [ ] **Step 3: Define complete `LandingDataSchema`**

Include site settings, hero badges, quick links, service blocks, workflow columns, honesty copy, cases, ratings, reviews, certificates, FAQ, contacts, legal text and media URLs. Export `type LandingData = z.infer<typeof LandingDataSchema>`.

- [ ] **Step 4: Implement repository and mapper**

Repository returns database rows only. Service maps rows into the public DTO, validates the final payload, and never exposes database-only IDs for settings/auth.

- [ ] **Step 5: Create realistic Russian seed fixture**

Seed six services, four quantified cases, six FAQ entries, four reviews, three certificates, ratings, Khabarovsk address fixture, demo phone and messenger URLs. Add an explicit admin banner `Демо-контакты требуют замены перед публикацией`.

- [ ] **Step 6: Implement Route Handler**

```ts
export async function GET() {
  const data = await getLandingData()
  return Response.json({ ok: true, data }, {
    headers: { "Cache-Control": "public, s-maxage=300, stale-while-revalidate=86400" },
  })
}
```

- [ ] **Step 7: Run focused tests**

Run:

```bash
npm test -- src/modules/content/landing-data.service.test.ts src/app/api/landing-data/route.test.ts
```

Expected: PASS with ordered and schema-valid payload.

---

### Task 4: Implement leads, phone normalization and rate limiting

**Files:**
- Create: `src/modules/leads/lead.schemas.ts`
- Create: `src/modules/leads/phone.ts`
- Create: `src/modules/leads/rate-limit.repository.ts`
- Create: `src/modules/leads/lead.repository.ts`
- Create: `src/modules/leads/create-lead.service.ts`
- Create: `src/modules/leads/create-lead.service.test.ts`
- Create: `src/app/api/leads/route.ts`
- Create: `src/app/api/leads/route.test.ts`

- [ ] **Step 1: Write failing domain tests**

```ts
it.each([
  ["8 (999) 123-45-67", "+79991234567"],
  ["+7 999 123 45 67", "+79991234567"],
])("normalizes %s", (input, expected) => {
  expect(normalizeRussianPhone(input)).toBe(expected)
})

it("rejects a sixth request in a 15 minute window", async () => {
  await expect(createLead(input, contextAtLimit)).rejects.toMatchObject({
    code: "RATE_LIMITED",
  })
})
```

- [ ] **Step 2: Run and confirm failure**

Run: `npm test -- src/modules/leads/create-lead.service.test.ts`

Expected: FAIL because lead functions are absent.

- [ ] **Step 3: Implement validation and atomic limit**

Accept name 2–80 chars, Russian phone normalized to E.164, optional situation up to 2000 chars, optional service up to 120 chars, and a honeypot field that must remain empty. Hash IP with `SESSION_SECRET`; enforce five accepted attempts per 15 minutes transactionally.

- [ ] **Step 4: Implement `POST /api/leads`**

Return `201 { ok: true, data: { id } }`, `422` field errors, and `429` with `Retry-After`. Do not log raw phone or situation.

- [ ] **Step 5: Run tests**

Run: `npm test -- src/modules/leads src/app/api/leads/route.test.ts`

Expected: PASS.

---

### Task 5: Implement password auth and database-backed sessions

**Files:**
- Create: `src/modules/auth/auth.schemas.ts`
- Create: `src/modules/auth/password.ts`
- Create: `src/modules/auth/session.ts`
- Create: `src/modules/auth/auth.repository.ts`
- Create: `src/modules/auth/auth.service.ts`
- Create: `src/modules/auth/auth.service.test.ts`
- Create: `src/modules/auth/require-admin.ts`
- Create: `src/app/api/admin/login/route.ts`
- Create: `src/app/api/admin/logout/route.ts`
- Create: `src/app/api/admin/session/route.ts`
- Create: `src/app/(admin)/admin/login/page.tsx`
- Create: `src/proxy.ts`

- [ ] **Step 1: Write failing session tests**

```ts
it("stores only a SHA-256 token hash", async () => {
  const result = await createSession(userId, repository)
  expect(result.token).toMatch(/^[A-Za-z0-9_-]{43}$/)
  expect(repository.inserted.tokenHash).not.toContain(result.token)
})

it("rejects expired sessions", async () => {
  await expect(requireSession(expiredCookie, repository)).rejects.toMatchObject({
    code: "UNAUTHORIZED",
  })
})
```

- [ ] **Step 2: Run and confirm failure**

Run: `npm test -- src/modules/auth/auth.service.test.ts`

Expected: FAIL because auth services are absent.

- [ ] **Step 3: Implement Argon2id and token lifecycle**

Generate 32 random bytes with `crypto.randomBytes`, encode base64url, store SHA-256 hash, expire after seven days, update last activity at most hourly, delete on logout.

- [ ] **Step 4: Implement login protection**

Normalize email, constant-time password verification through Argon2, rate limit by hashed IP and normalized email, issue cookie `admin_session` with `HttpOnly`, `SameSite=Strict`, `Secure` in production and path `/`.

- [ ] **Step 5: Protect admin routes**

Next.js 16 `proxy.ts` performs an early cookie-presence redirect with a `/admin/:path*` matcher. Every admin page and mutation performs authoritative `requireAdmin()` database validation; Proxy is not treated as the security boundary.

- [ ] **Step 6: Run tests**

Run: `npm test -- src/modules/auth src/app/api/admin`

Expected: PASS for login, expiry and logout.

---

### Task 6: Build authenticated content CRUD APIs

**Files:**
- Create: `src/modules/content/admin-content.service.ts`
- Create: `src/modules/content/admin-content.service.test.ts`
- Create: `src/lib/http/api-response.ts`
- Create: `src/lib/http/origin.ts`
- Create: `src/app/api/admin/content/settings/route.ts`
- Create: `src/app/api/admin/content/services/route.ts`
- Create: `src/app/api/admin/content/services/[id]/route.ts`
- Create: `src/app/api/admin/content/cases/route.ts`
- Create: `src/app/api/admin/content/faqs/route.ts`
- Create: `src/app/api/admin/content/reviews/route.ts`
- Create: `src/app/api/admin/content/certificates/route.ts`
- Create: `src/app/api/admin/content/reorder/route.ts`

- [ ] **Step 1: Write failing authorization and reorder tests**

```ts
it("rejects mutation without a valid admin", async () => {
  const response = await updateSettings(request, unauthenticatedContext)
  expect(response.status).toBe(401)
})

it("reorders all case rows in one transaction", async () => {
  await reorder("cases", [caseC, caseA, caseB], repository)
  expect(repository.committedOrder).toEqual([caseC, caseA, caseB])
})
```

- [ ] **Step 2: Run and confirm failure**

Run: `npm test -- src/modules/content/admin-content.service.test.ts`

Expected: FAIL.

- [ ] **Step 3: Implement API envelope and mutation guards**

Use `{ ok: true, data } | { ok: false, error: { code, message, fields? } }`. Require session, same-origin request and Zod body on every mutation.

- [ ] **Step 4: Implement transactional CRUD and reorder**

Allow only known entity types. Lock affected rows, validate the full ID set, update contiguous order and commit. Call `revalidateTag("landing-data", "max")` after successful content mutation.

- [ ] **Step 5: Run tests**

Run: `npm test -- src/modules/content/admin-content.service.test.ts src/app/api/admin/content`

Expected: PASS.

---

### Task 7: Implement Timeweb S3 media uploads

**Files:**
- Create: `src/modules/media/media.schemas.ts`
- Create: `src/modules/media/s3.client.ts`
- Create: `src/modules/media/media.service.ts`
- Create: `src/modules/media/media.service.test.ts`
- Create: `src/app/api/admin/media/presign/route.ts`
- Create: `src/app/api/admin/media/complete/route.ts`
- Create: `src/app/api/admin/media/route.ts`

- [ ] **Step 1: Write failing allowlist tests**

```ts
it.each(["image/jpeg", "image/png", "image/webp", "video/mp4"])(
  "accepts %s",
  (type) => expect(MediaPresignSchema.safeParse({ name: "asset.bin", type, size: 1024 }).success).toBe(true),
)

it("rejects files larger than the configured limit", () => {
  expect(MediaPresignSchema.safeParse({
    name: "huge.mp4", type: "video/mp4", size: 101 * 1024 * 1024,
  }).success).toBe(false)
})
```

- [ ] **Step 2: Run and confirm failure**

Run: `npm test -- src/modules/media/media.service.test.ts`

Expected: FAIL.

- [ ] **Step 3: Implement presign and completion**

Generate UUID object keys, preserve a normalized extension, permit images up to 12 MB and MP4 up to 100 MB, create PUT URL valid for five minutes, verify object metadata with `HeadObject` before inserting `media_assets`.

- [ ] **Step 4: Run tests with mocked S3 client**

Run: `npm test -- src/modules/media`

Expected: PASS without external network calls.

---

### Task 8: Build the admin shell and structured editors

**Files:**
- Create: `src/app/(admin)/admin/layout.tsx`
- Create: `src/app/(admin)/admin/page.tsx`
- Create: `src/app/(admin)/admin/services/page.tsx`
- Create: `src/app/(admin)/admin/cases/page.tsx`
- Create: `src/app/(admin)/admin/faq/page.tsx`
- Create: `src/app/(admin)/admin/reviews/page.tsx`
- Create: `src/app/(admin)/admin/media/page.tsx`
- Create: `src/app/(admin)/admin/contacts/page.tsx`
- Create: `src/app/(admin)/admin/leads/page.tsx`
- Create: `src/components/admin/AdminShell.tsx`
- Create: `src/components/admin/EntityEditor.tsx`
- Create: `src/components/admin/SortableEntityList.tsx`
- Create: `src/components/admin/MediaUploader.tsx`
- Create: `src/components/admin/SaveBar.tsx`
- Create: `src/components/admin/admin-components.test.tsx`

- [ ] **Step 1: Write failing editor state tests**

```tsx
it("does not persist a dirty form until Save is clicked", async () => {
  render(<EntityEditor initialValue={service} onSave={onSave} />)
  await userEvent.type(screen.getByLabelText("Описание"), " Дополнение")
  expect(onSave).not.toHaveBeenCalled()
  await userEvent.click(screen.getByRole("button", { name: "Сохранить" }))
  expect(onSave).toHaveBeenCalledTimes(1)
})
```

- [ ] **Step 2: Run and confirm failure**

Run: `npm test -- src/components/admin/admin-components.test.tsx`

Expected: FAIL.

- [ ] **Step 3: Implement accessible shell and editors**

Use semantic labels, keyboard-reorder support through dnd-kit, explicit save, dirty state, field-level server errors, delete confirmation and responsive sidebar.

- [ ] **Step 4: Add media progress and VK validation**

Upload directly to the presigned URL with `XMLHttpRequest` progress. Accept VK embed only when parsed hostname belongs to the configured VK allowlist.

- [ ] **Step 5: Add leads list and CSV response**

Create authenticated list/status endpoints and UTF-8 BOM CSV export with columns date, name, phone, service, situation and status.

- [ ] **Step 6: Run tests**

Run: `npm test -- src/components/admin src/app/api/admin`

Expected: PASS.

---

### Task 9: Build landing data loading, Lenis and the cinematic shell

**Files:**
- Create: `src/app/(site)/page.tsx`
- Create: `src/app/(site)/loading.tsx`
- Create: `src/app/(site)/error.tsx`
- Create: `src/modules/content/fetch-landing-data.ts`
- Create: `src/components/motion/LenisProvider.tsx`
- Create: `src/components/motion/Reveal.tsx`
- Create: `src/components/motion/MagneticButton.tsx`
- Create: `src/components/site/Header.tsx`
- Create: `src/components/site/Hero.tsx`
- Create: `src/components/site/MobileMenu.tsx`
- Create: `src/components/site/VideoStage.tsx`
- Create: `src/components/site/site-shell.test.tsx`

- [ ] **Step 1: Write failing shell tests**

```tsx
it("renders the exact hero heading and CTA", () => {
  render(<Hero data={landing.hero} />)
  expect(screen.getByRole("heading", {
    name: "Развод, алименты и раздел имущества в Хабаровске",
  })).toBeVisible()
  expect(screen.getByRole("button", { name: "Получить оценку ситуации" })).toBeVisible()
})
```

- [ ] **Step 2: Run and confirm failure**

Run: `npm test -- src/components/site/site-shell.test.tsx`

Expected: FAIL.

- [ ] **Step 3: Implement one server-side data request**

Fetch `${NEXT_PUBLIC_SITE_URL}/api/landing-data` with `next: { tags: ["landing-data"] }`, validate the response with `LandingDataSchema`, and render a controlled error fallback on invalid data.

- [ ] **Step 4: Implement Lenis and reduced motion**

Initialize Lenis only when `matchMedia("(prefers-reduced-motion: no-preference)")` matches. Route all internal anchors through `lenis.scrollTo`.

- [ ] **Step 5: Implement header, menu and hero**

Use `motion/react`, word-by-word H1 reveal, focus-trapped full-screen navigation, Escape close, body scroll lock, local cinematic MP4 fallback, stable aspect container and user-gesture mute control.

- [ ] **Step 6: Run tests**

Run: `npm test -- src/components/site/site-shell.test.tsx`

Expected: PASS.

---

### Task 10: Build quick access, X-ray document and services

**Files:**
- Create: `src/components/site/QuickAccess.tsx`
- Create: `src/components/site/ContractXRay.tsx`
- Create: `src/components/site/ServicesSection.tsx`
- Create: `src/components/site/ServiceTabs.tsx`
- Create: `src/components/site/JusticeScales.tsx`
- Create: `src/components/site/services.test.tsx`

- [ ] **Step 1: Write failing navigation tests**

```tsx
it("links each quick card to its service anchor", () => {
  render(<QuickAccess items={landing.quickLinks} />)
  expect(screen.getByRole("link", { name: "Развод" })).toHaveAttribute("href", "#razvod")
  expect(screen.getByRole("link", { name: "Алименты" })).toHaveAttribute("href", "#alimenty")
})
```

- [ ] **Step 2: Run and confirm failure**

Run: `npm test -- src/components/site/services.test.tsx`

Expected: FAIL.

- [ ] **Step 3: Implement flashlight without pointer state**

Store pointer X/Y in MotionValues, build radial mask through `useMotionTemplate`, render blurred and sharp document layers, and disable pointer-follow for coarse pointers/reduced motion.

- [ ] **Step 4: Implement services and active tabs**

Render six stable IDs, update active slug with IntersectionObserver, use native horizontal overflow without visible scrollbar on mobile, and pass service title into the modal trigger.

- [ ] **Step 5: Implement SVG scales**

Animate beam rotation and pan Y positions when entering viewport. Apply a controlled client-side tilt while the property division card is hovered or focused.

- [ ] **Step 6: Run tests**

Run: `npm test -- src/components/site/services.test.tsx`

Expected: PASS.

---

### Task 11: Build workflow, trust, stacking cases, reviews and FAQ

**Files:**
- Create: `src/components/site/Workflow.tsx`
- Create: `src/components/site/HonestyBanner.tsx`
- Create: `src/components/site/CasesStack.tsx`
- Create: `src/components/site/Reviews.tsx`
- Create: `src/components/site/Certificates.tsx`
- Create: `src/components/site/Faq.tsx`
- Create: `src/components/site/content-sections.test.tsx`

- [ ] **Step 1: Write failing content tests**

```tsx
it("renders four ordered cases and an accessible FAQ", async () => {
  render(<><CasesStack cases={landing.cases} /><Faq items={landing.faqs} /></>)
  expect(screen.getAllByTestId("case-card")).toHaveLength(4)
  const trigger = screen.getByRole("button", { name: landing.faqs[0].question })
  expect(trigger).toHaveAttribute("aria-expanded", "false")
  await userEvent.click(trigger)
  expect(trigger).toHaveAttribute("aria-expanded", "true")
})
```

- [ ] **Step 2: Run and confirm failure**

Run: `npm test -- src/components/site/content-sections.test.tsx`

Expected: FAIL.

- [ ] **Step 3: Implement stacking cards**

Use sticky cards with incremental top offsets. Feed section progress into scale transforms for previous cards; preserve normal document flow and readable reduced-motion layout.

- [ ] **Step 4: Implement reviews and certificates**

Use CSS scroll snap for one mobile card per viewport, Motion controls for desktop navigation, touch-safe drag behavior, external rating links with secure `rel`, and responsive `next/image`.

- [ ] **Step 5: Implement FAQ**

Use semantic buttons, `AnimatePresence`, overflow-hidden answer region, animated height/opacity and rotating plus icon. Preserve keyboard and screen-reader behavior.

- [ ] **Step 6: Run tests**

Run: `npm test -- src/components/site/content-sections.test.tsx`

Expected: PASS.

---

### Task 12: Build contacts, map, floating actions and global modal

**Files:**
- Create: `src/components/site/Contacts.tsx`
- Create: `src/components/site/YandexMap.tsx`
- Create: `src/components/site/FloatingActions.tsx`
- Create: `src/components/site/Footer.tsx`
- Create: `src/components/forms/ModalProvider.tsx`
- Create: `src/components/forms/ModalForm.tsx`
- Create: `src/components/forms/modal-form.test.tsx`
- Create: `src/types/yandex-metrika.d.ts`
- Create: `src/app/privacy/page.tsx`

- [ ] **Step 1: Write failing success-state test**

```tsx
it("replaces the form with success content and fires Metrika after 201", async () => {
  server.use(http.post("/api/leads", () => HttpResponse.json({
    ok: true, data: { id: "lead-id" },
  }, { status: 201 })))
  render(<ModalForm initialService="Раздел имущества" />)
  await userEvent.type(screen.getByLabelText("Имя"), "Алексей")
  await userEvent.type(screen.getByLabelText("Телефон"), "+7 999 123-45-67")
  await userEvent.click(screen.getByRole("button", { name: "Отправить" }))
  expect(await screen.findByText("Спасибо, заявка получена.")).toBeVisible()
  expect(window.ym).toHaveBeenCalledWith(expect.any(Number), "reachGoal", "lead_success")
})
```

- [ ] **Step 2: Run and confirm failure**

Run: `npm test -- src/components/forms/modal-form.test.tsx`

Expected: FAIL.

- [ ] **Step 3: Implement isolated modal state**

Mount one provider in root layout. Keep open, service, form and success state inside the modal subtree. Add focus trap, Escape close, close-button label, background inertness and no redirect.

- [ ] **Step 4: Implement map and floating actions**

Load Yandex Map only after a near-viewport IntersectionObserver signal. Apply a muted grayscale/sage treatment where map API styling permits. Show scroll-to-top after 400 px through a MotionValue event and use Lenis for return.

- [ ] **Step 5: Implement contacts, footer and privacy page**

Render phone, Telegram, WhatsApp, address, legal details, 152-ФЗ consent text, privacy link and non-public-offer disclaimer from the API.

- [ ] **Step 6: Run tests**

Run: `npm test -- src/components/forms/modal-form.test.tsx src/components/site`

Expected: PASS.

---

### Task 13: Add integration and browser coverage

**Files:**
- Create: `vitest.config.ts`
- Create: `src/test/setup.ts`
- Create: `playwright.config.ts`
- Create: `tests/integration/helpers/database.ts`
- Create: `tests/integration/content-api.test.ts`
- Create: `tests/integration/auth-api.test.ts`
- Create: `tests/integration/leads-api.test.ts`
- Create: `tests/e2e/landing.spec.ts`
- Create: `tests/e2e/admin.spec.ts`
- Create: `tests/e2e/reduced-motion.spec.ts`

- [ ] **Step 1: Configure isolated test environments**

Use jsdom for component tests, node environment for repositories, a separate `TEST_DATABASE_URL`, per-suite transaction rollback, and Playwright web server `npm run dev`.

- [ ] **Step 2: Add API integration tests**

Verify valid and invalid DTOs, same-origin guard, login/session/logout, CRUD/reorder rollback, lead limit and S3 completion with mocked AWS transport.

- [ ] **Step 3: Add landing journey**

Open `/`, assert hero, navigate quick access, open modal from a service, submit a lead, verify success state and confirm URL remains `/`.

- [ ] **Step 4: Add admin journey**

Login, edit FAQ, reorder cases, upload a mocked media object, refresh and verify persistence, then logout and verify redirect.

- [ ] **Step 5: Add reduced-motion journey**

Emulate reduced motion, assert content remains visible, Lenis is absent, sticky cases remain readable and no infinite animations run.

- [ ] **Step 6: Run the full test suite**

Run:

```bash
npm run lint && npm run typecheck && npm test && npm run test:e2e
```

Expected: all commands exit `0`.

---

### Task 14: Package for Timeweb and perform release verification

**Files:**
- Create: `Dockerfile`
- Create: `.dockerignore`
- Create: `docker-compose.yml`
- Create: `src/app/api/health/route.ts`
- Create: `README.md`
- Modify: `next.config.ts`

- [ ] **Step 1: Add health checks**

`GET /api/health` returns `200` only when the app can execute `select 1`; otherwise return `503` without connection details.

- [ ] **Step 2: Add multi-stage standalone Docker image**

Use dependency, builder and runner stages; run as a non-root user; copy `.next/standalone`, `.next/static` and `public`; expose `3000`.

- [ ] **Step 3: Add local PostgreSQL composition**

Define PostgreSQL with healthcheck, named volume and app dependency. Keep actual credentials in `.env`, not compose source.

- [ ] **Step 4: Document deployment order**

README commands:

```bash
npm ci
npm run db:migrate
npm run db:seed
npm run build
npm start
```

Document Timeweb PostgreSQL SSL, S3 CORS for the production origin, all environment variables, backup policy and admin password rotation.

- [ ] **Step 5: Run release verification**

Run:

```bash
npm run lint
npm run typecheck
npm test
npm run build
docker build -t artem-sysuev-site:local .
```

Expected: every command exits `0`; image starts as non-root and `/api/health` returns `200` with PostgreSQL available.

- [ ] **Step 6: Perform manual acceptance**

Check desktop and iPhone-sized layouts, keyboard-only navigation, focus visibility, modal focus restoration, VK failure fallback, map lazy load, one-card mobile reviews, 400 px scroll arrow threshold, external links, privacy copy and admin CRUD persistence.

---

## Implementation order and checkpoints

1. Tasks 1–3 produce a typed, seeded content API.
2. Tasks 4–7 produce secure backend capabilities.
3. Task 8 produces the usable custom admin panel.
4. Tasks 9–12 produce the complete animated landing page.
5. Tasks 13–14 prove behavior and package the release.

After each task, run its focused checks. Do not defer typecheck/lint failures to a later task. Do not create Git commits unless the user explicitly authorizes them.
