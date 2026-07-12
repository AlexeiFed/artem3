# Hero Video Dossier Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the oversized abstract hero with a viewport-safe local video portrait, semantic three-line heading, CTA copy, reduced-motion poster fallback, and an asymmetrical metrics dossier that hides the AI mark.

**Architecture:** Keep `Hero` as the smallest client boundary and consume only validated `LandingData["hero"]`. Extend the Zod content contract with backward-compatible default metrics, keep existing `badges` and VK fields for API compatibility, but render the local `fallbackUrl` as the hero media. Use static self-hosted media, existing design tokens, `motion/react`, and poster-first error/reduced-motion behavior.

**Tech Stack:** Next.js 16 App Router, React 19, strict TypeScript, Zod 4, motion/react, Vitest + Testing Library, Playwright, ffmpeg.

**Commit policy:** Commit commands below are checkpoints only. Do not run them unless the user explicitly authorizes commits.

---

## File map

**Create**

- `public/media/artem-hero-loop.mp4` — processed muted seamless video.
- `public/media/artem-hero-poster.jpg` — stable first-frame fallback.
- `src/components/site/Hero.test.tsx` — focused hero behavior tests.
- `playwright.config.ts` — local E2E runner configuration.
- `tests/e2e/hero.spec.ts` — viewport, overflow, reduced-motion, and overlay checks.

**Modify**

- `src/modules/content/content.schemas.ts` — defaulted three-item metrics contract.
- `src/modules/content/content.schemas.test.ts` — backward-compatibility and cardinality tests.
- `src/db/seed-data.ts` — approved metrics, CTA, disclaimer, and media paths.
- `src/modules/content/landing-data.service.test.ts` — mapped metrics assertion.
- `src/app/api/landing-data/route.test.ts` — public API metrics assertion.
- `src/components/site/Hero.tsx` — local video, poster fallback, exact title lines, metrics dossier.
- `src/components/site/site-shell.test.tsx` — remove stale CTA expectation; retain quick-link coverage.
- `src/app/globals.css` — header, hero, dossier, responsive and reduced-motion styles.

**Intentionally unchanged**

- `src/lib/design-tokens.ts` — existing tokens already cover every color, radius, shadow, and motion value.
- `src/modules/content/map-landing-data.ts` — the existing spread automatically carries defaulted `metrics`.
- Admin routes/repository — `HeroSettingsSchema` is already reused by authenticated PATCH.
- Dedicated hero admin editor — outside this hero implementation; no new admin subsystem.
- Database schema/migrations — hero remains JSONB and Zod defaults support old rows.

---

### Task 1: Produce the local video loop and poster

**Files:**
- Create: `public/media/artem-hero-loop.mp4`
- Create: `public/media/artem-hero-poster.jpg`
- Source: `/Users/alex/Downloads/artem.mp4`

- [ ] **Step 1: Verify the source and destination parent**

Run:

```bash
ls -ld "/Users/alex/projects/artem3/.worktrees/artem-landing" \
  "/Users/alex/Downloads/artem.mp4"
ffprobe -v error \
  -show_entries format=duration,size:stream=codec_name,codec_type,width,height,r_frame_rate \
  -of json "/Users/alex/Downloads/artem.mp4"
```

Expected: source exists; video is H.264, 1280×720, 24 fps, about 10 seconds.

- [ ] **Step 2: Create the media directory**

Run:

```bash
mkdir -p "/Users/alex/projects/artem3/.worktrees/artem-landing/public/media"
```

Expected: exit 0.

- [ ] **Step 3: Build the cyclic crossfade**

Run:

```bash
ffmpeg -y -v error \
  -i "/Users/alex/Downloads/artem.mp4" \
  -filter_complex \
  "[0:v]trim=start=0.75:end=9.5,setpts=PTS-STARTPTS[mid];\
[0:v]trim=start=9.5:end=10,setpts=PTS-STARTPTS[tail];\
[0:v]trim=start=0.25:end=0.75,setpts=PTS-STARTPTS[head];\
[tail][head]xfade=transition=fade:duration=0.5:offset=0[seam];\
[mid][seam]concat=n=2:v=1:a=0,format=yuv420p[out]" \
  -map "[out]" \
  -an \
  -c:v libx264 \
  -preset medium \
  -crf 21 \
  -movflags +faststart \
  "/Users/alex/projects/artem3/.worktrees/artem-landing/public/media/artem-hero-loop.mp4"
```

Expected: exit 0; no audio stream is written.

- [ ] **Step 4: Generate the poster from a stable frame**

Run:

```bash
ffmpeg -y -v error \
  -ss 3 \
  -i "/Users/alex/projects/artem3/.worktrees/artem-landing/public/media/artem-hero-loop.mp4" \
  -frames:v 1 \
  -q:v 3 \
  "/Users/alex/projects/artem3/.worktrees/artem-landing/public/media/artem-hero-poster.jpg"
```

Expected: exit 0 and a 1280×720 JPEG poster.

- [ ] **Step 5: Verify production media**

Run:

```bash
ffprobe -v error \
  -show_entries format=duration,size:stream=codec_name,codec_type,width,height,r_frame_rate \
  -of json \
  "/Users/alex/projects/artem3/.worktrees/artem-landing/public/media/artem-hero-loop.mp4"
file "/Users/alex/projects/artem3/.worktrees/artem-landing/public/media/artem-hero-poster.jpg"
```

Expected:

- duration `9.25` seconds;
- one H.264 video stream;
- no audio stream;
- MP4 around 1.5 MB;
- valid JPEG poster.

- [ ] **Step 6: Commit the media checkpoint if authorized**

```bash
git add public/media/artem-hero-loop.mp4 public/media/artem-hero-poster.jpg
git commit -m "assets: add optimized hero video portrait"
```

---

### Task 2: Extend the hero content contract with metrics

**Files:**
- Modify: `src/modules/content/content.schemas.test.ts`
- Modify: `src/modules/content/content.schemas.ts`
- Modify: `src/db/seed-data.ts`
- Modify: `src/modules/content/landing-data.service.test.ts`
- Modify: `src/app/api/landing-data/route.test.ts`

- [ ] **Step 1: Add failing backward-compatibility and cardinality tests**

Add inside `describe("HeroSettingsSchema", ...)` in `src/modules/content/content.schemas.test.ts`:

```ts
const APPROVED_METRICS = [
  { value: "11+", label: "лет практики" },
  { value: "200+", label: "дел доведено до результата" },
  { value: "0 ₽", label: "первая консультация" },
];

it("defaults approved metrics for legacy hero settings", () => {
  const settings = createValidHeroSettings();
  const { metrics: _metrics, ...legacyHero } = settings.hero;

  const parsed = HeroSettingsSchema.parse({
    ...settings,
    hero: legacyHero,
  });

  expect(parsed.hero.metrics).toEqual(APPROVED_METRICS);
});

it("requires exactly three hero metrics", () => {
  const settings = createValidHeroSettings();
  const result = HeroSettingsSchema.safeParse({
    ...settings,
    hero: {
      ...settings.hero,
      metrics: APPROVED_METRICS.slice(0, 2),
    },
  });

  expect(result.success).toBe(false);
});
```

Add to the main mapping test in `src/modules/content/landing-data.service.test.ts`:

```ts
expect(data.hero.metrics).toEqual(seedContent.settings.hero.hero.metrics);
```

Add after the title assertion in `src/app/api/landing-data/route.test.ts`:

```ts
expect(body.data.hero.metrics).toEqual([
  { value: "11+", label: "лет практики" },
  { value: "200+", label: "дел доведено до результата" },
  { value: "0 ₽", label: "первая консультация" },
]);
```

- [ ] **Step 2: Run the focused tests and confirm failure**

Run:

```bash
npm test -- \
  src/modules/content/content.schemas.test.ts \
  src/modules/content/landing-data.service.test.ts \
  src/app/api/landing-data/route.test.ts
```

Expected: FAIL because `metrics` is absent or stripped by the current schema.

- [ ] **Step 3: Implement the defaulted metrics schema**

In `src/modules/content/content.schemas.ts`, add after `HeroBadgeSchema`:

```ts
export const DEFAULT_HERO_METRICS = [
  { value: "11+", label: "лет практики" },
  { value: "200+", label: "дел доведено до результата" },
  { value: "0 ₽", label: "первая консультация" },
];

export const HeroMetricSchema = z.object({
  value: shortText,
  label: shortText,
});

export const HeroMetricsSchema = z
  .array(HeroMetricSchema)
  .length(3, "Должно быть ровно три показателя hero")
  .default(DEFAULT_HERO_METRICS);
```

Add `metrics` to `HeroContentSchema` while preserving `badges`:

```ts
export const HeroContentSchema = z.object({
  eyebrow: shortText,
  title: z.literal("Развод, алименты и раздел имущества в Хабаровске"),
  subtitle: z.literal(APPROVED_HERO_SUBTITLE, {
    error: "Подзаголовок должен соответствовать утверждённому тексту",
  }),
  badges: z.array(HeroBadgeSchema).length(4),
  metrics: HeroMetricsSchema,
  cta: CtaSchema,
  disclaimer: mediumText,
  video: z.object({
    fallbackUrl: localAssetUrl,
    posterUrl: localAssetUrl,
    vkEmbed: VkEmbedSchema.optional(),
  }),
});
```

- [ ] **Step 4: Update approved seed content**

Replace the hero fields in `src/db/seed-data.ts` with:

```ts
hero: {
  eyebrow: "Семейный и имущественный юрист",
  title: "Развод, алименты и раздел имущества в Хабаровске",
  subtitle:
    "Помогаю решить семейные и имущественные споры без лишнего стресса и затяжных судов",
  badges: [
    { label: "Личная работа юриста" },
    { label: "Понятный план действий" },
    { label: "Фиксируем стоимость" },
    { label: "Конфиденциально" },
  ],
  metrics: [
    { value: "11+", label: "лет практики" },
    { value: "200+", label: "дел доведено до результата" },
    { value: "0 ₽", label: "первая консультация" },
  ],
  cta: { label: "Получить оценку ситуации", target: "#contacts" },
  disclaimer:
    "Первая консультация — бесплатная. Результат по делу заранее не гарантируется.",
  video: {
    fallbackUrl: "/media/artem-hero-loop.mp4",
    posterUrl: "/media/artem-hero-poster.jpg",
  },
},
```

- [ ] **Step 5: Run focused contract tests**

Run:

```bash
npm test -- \
  src/modules/content/content.schemas.test.ts \
  src/modules/content/landing-data.service.test.ts \
  src/app/api/landing-data/route.test.ts
```

Expected: PASS.

- [ ] **Step 6: Commit the content checkpoint if authorized**

```bash
git add \
  src/modules/content/content.schemas.ts \
  src/modules/content/content.schemas.test.ts \
  src/db/seed-data.ts \
  src/modules/content/landing-data.service.test.ts \
  src/app/api/landing-data/route.test.ts
git commit -m "feat: add validated hero proof metrics"
```

---

### Task 3: Specify hero behavior with focused component tests

**Files:**
- Create: `src/components/site/Hero.test.tsx`
- Modify: `src/components/site/site-shell.test.tsx`

- [ ] **Step 1: Add the focused failing Hero test suite**

Create `src/components/site/Hero.test.tsx`:

```tsx
// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";

import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { ModalProvider } from "@/components/forms/ModalProvider";
import { getPreviewLandingData } from "@/modules/content/preview-landing-data";

import { Hero } from "./Hero";

const motionState = vi.hoisted(() => ({ reduced: false }));

vi.mock("motion/react", async (importOriginal) => {
  const actual = await importOriginal<typeof import("motion/react")>();
  return {
    ...actual,
    useReducedMotion: () => motionState.reduced,
  };
});

afterEach(() => {
  cleanup();
  motionState.reduced = false;
});

function renderHero() {
  const data = getPreviewLandingData().hero;
  return {
    data,
    ...render(
      <ModalProvider metrikaId={undefined}>
        <Hero data={data} />
      </ModalProvider>,
    ),
  };
}

describe("Hero", () => {
  it("renders the approved heading, CTA and consultation note", () => {
    renderHero();

    expect(
      screen.getByRole("heading", {
        name: "Развод, алименты и раздел имущества в Хабаровске",
      }),
    ).toBeVisible();
    expect(
      screen.getByRole("button", { name: "Получить оценку ситуации" }),
    ).toBeVisible();
    expect(
      screen.getByText("Первая консультация — бесплатная.", { exact: false }),
    ).toBeVisible();
  });

  it("renders all three proof metrics", () => {
    renderHero();

    const metrics = screen.getByRole("list", {
      name: "Практика в цифрах",
    });
    expect(metrics).toHaveTextContent("11+");
    expect(metrics).toHaveTextContent("200+");
    expect(metrics).toHaveTextContent("0 ₽");
    expect(metrics).toHaveTextContent("дел доведено до результата");
  });

  it("renders the local muted looping video without VK or sound controls", () => {
    const { data } = renderHero();
    const video = screen.getByTestId("hero-video");

    expect(video).toHaveAttribute("src", data.video.fallbackUrl);
    expect(video).toHaveAttribute("poster", data.video.posterUrl);
    expect(video).toHaveAttribute("autoplay");
    expect(video).toHaveAttribute("loop");
    expect(video).toHaveAttribute("playsinline");
    expect(video).toHaveAttribute("preload", "metadata");
    expect(video).toHaveProperty("muted", true);
    expect(screen.queryByTitle(/VK-плеер/u)).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /звук/u }),
    ).not.toBeInTheDocument();
  });

  it("keeps the poster when video loading fails", () => {
    renderHero();

    fireEvent.error(screen.getByTestId("hero-video"));

    expect(screen.queryByTestId("hero-video")).not.toBeInTheDocument();
    expect(screen.getByTestId("hero-poster")).toBeVisible();
  });

  it("uses the abstract fallback when the poster fails", () => {
    renderHero();

    fireEvent.error(screen.getByTestId("hero-poster"));

    expect(screen.queryByTestId("hero-poster")).not.toBeInTheDocument();
    expect(screen.getByTestId("hero-abstract")).toBeVisible();
  });

  it("uses poster-only mode for reduced motion", () => {
    motionState.reduced = true;
    renderHero();

    expect(screen.queryByTestId("hero-video")).not.toBeInTheDocument();
    expect(screen.getByTestId("hero-stage")).toHaveAttribute(
      "data-reduced-motion",
      "true",
    );
  });

  it("opens the existing lead modal from the CTA", () => {
    renderHero();

    fireEvent.click(
      screen.getByRole("button", { name: "Получить оценку ситуации" }),
    );

    expect(
      screen.getByRole("dialog", { name: "Обсудить ситуацию" }),
    ).toBeVisible();
  });
});
```

- [ ] **Step 2: Remove the stale hero assertion from the shell test**

In `src/components/site/site-shell.test.tsx`:

- remove the `Hero` import;
- remove the test named `renders the exact hero heading and CTA`;
- keep `QuickAccess` coverage unchanged.

Focused Hero behavior now belongs only in `Hero.test.tsx`.

- [ ] **Step 3: Run the Hero test and confirm failure**

Run:

```bash
npm test -- src/components/site/Hero.test.tsx
```

Expected: FAIL because the current component has no local `<video>`, metrics dossier, poster-only state, or approved CTA.

---

### Task 4: Implement the local video hero and dossier

**Files:**
- Modify: `src/components/site/Hero.tsx`

- [ ] **Step 1: Replace Hero with the validated local-media implementation**

Replace `src/components/site/Hero.tsx` with:

```tsx
"use client";

import Image from "next/image";
import { useState } from "react";
import { motion, useReducedMotion } from "motion/react";

import { useOptionalModal } from "@/components/forms/ModalProvider";
import { MagneticButton } from "@/components/motion/MagneticButton";
import type { LandingData } from "@/modules/content/content.types";

const TITLE_LINES = [
  { text: "Развод, алименты", className: "" },
  { text: "и раздел имущества", className: "" },
  { text: "в Хабаровске", className: " hero-title-place" },
] as const;

export function Hero({ data }: { data: LandingData["hero"] }) {
  const modal = useOptionalModal();
  const reduced = useReducedMotion();
  const [videoFailed, setVideoFailed] = useState(false);
  const [posterFailed, setPosterFailed] = useState(false);
  const showVideo = reduced === false && !videoFailed;

  return (
    <section id="main" className="hero">
      <div
        className="hero-stage"
        data-testid="hero-stage"
        data-reduced-motion={reduced === true ? "true" : "false"}
        aria-hidden="true"
      >
        {posterFailed ? (
          <div className="hero-abstract" data-testid="hero-abstract">
            <span />
            <span />
            <span />
          </div>
        ) : (
          <Image
            data-testid="hero-poster"
            className="hero-poster"
            src={data.video.posterUrl}
            alt=""
            fill
            preload
            sizes="100vw"
            onError={() => setPosterFailed(true)}
          />
        )}
        {showVideo ? (
          <video
            data-testid="hero-video"
            src={data.video.fallbackUrl}
            poster={data.video.posterUrl}
            autoPlay
            muted
            loop
            playsInline
            preload="metadata"
            tabIndex={-1}
            onError={() => setVideoFailed(true)}
          />
        ) : null}
      </div>

      <div className="hero-overlay" aria-hidden="true" />
      <motion.div
        className="hero-case-cover"
        aria-hidden="true"
        initial={reduced ? false : { clipPath: "inset(0 0 0 0)" }}
        animate={{ clipPath: "inset(0 100% 0 0)" }}
        transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
      />

      <div className="hero-content shell">
        <div className="hero-copy">
          <motion.p
            className="eyebrow hero-eyebrow"
            initial={reduced ? false : { opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
          >
            {data.eyebrow}
          </motion.p>

          <h1 aria-label={data.title}>
            {TITLE_LINES.map((line, index) => (
              <motion.span
                aria-hidden="true"
                className={`hero-title-line${line.className}`}
                key={line.text}
                initial={reduced ? false : { opacity: 0, y: "55%" }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.16 + index * 0.08 }}
              >
                {line.text}
              </motion.span>
            ))}
          </h1>

          <motion.p
            className="hero-subtitle"
            initial={reduced ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.42 }}
          >
            {data.subtitle}
          </motion.p>

          <motion.div
            className="hero-actions"
            initial={reduced ? false : { opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <MagneticButton
              type="button"
              className="button button-light"
              onClick={() => modal?.openModal()}
            >
              {data.cta.label}
            </MagneticButton>
          </motion.div>

          <p className="hero-disclaimer">{data.disclaimer}</p>
        </div>

        <motion.span
          className="hero-dossier-rule"
          aria-hidden="true"
          initial={reduced ? false : { scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ delay: 0.5, duration: 0.24 }}
        />

        <motion.aside
          className="hero-dossier"
          aria-label="Практика в цифрах"
          initial={reduced ? false : { opacity: 0, x: "18%" }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.68, duration: 0.56 }}
        >
          <span className="hero-dossier-tab">Практика в цифрах</span>
          <ol aria-label="Практика в цифрах">
            {data.metrics.map((metric, index) => (
              <li key={metric.label}>
                <span className="hero-metric-index" aria-hidden="true">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <strong>{metric.value}</strong>
                <span>{metric.label}</span>
              </li>
            ))}
          </ol>
        </motion.aside>
      </div>
    </section>
  );
}
```

- [ ] **Step 2: Run the focused Hero test**

Run:

```bash
npm test -- src/components/site/Hero.test.tsx
```

Expected: component behavior tests pass; CSS/layout work is still pending.

- [ ] **Step 3: Run TypeScript before styling**

Run:

```bash
npm run typecheck
```

Expected: PASS.

- [ ] **Step 4: Commit the component checkpoint if authorized**

```bash
git add \
  src/components/site/Hero.tsx \
  src/components/site/Hero.test.tsx \
  src/components/site/site-shell.test.tsx
git commit -m "feat: render accessible local video hero"
```

---

### Task 5: Implement the approved visual hierarchy and responsive dossier

**Files:**
- Modify: `src/app/globals.css:92-97`
- Modify: `src/app/globals.css:152-171`
- Modify: `src/app/globals.css:258-411`
- Modify: `src/app/globals.css:1389-1399`
- Create: `playwright.config.ts`
- Create: `tests/e2e/hero.spec.ts`

- [ ] **Step 1: Create the initial layout regression harness**

Create `playwright.config.ts`:

```ts
import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  reporter: "list",
  use: {
    baseURL: "http://127.0.0.1:3000",
    trace: "on-first-retry",
  },
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
    { name: "webkit", use: { ...devices["Desktop Safari"] } },
  ],
  webServer: {
    command: "npm run dev -- --hostname 127.0.0.1",
    url: "http://127.0.0.1:3000",
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
```

Create the initial `tests/e2e/hero.spec.ts`:

```ts
import { expect, test } from "@playwright/test";

const viewports = [
  { name: "desktop-1366", width: 1366, height: 768 },
  { name: "desktop-1440", width: 1440, height: 900 },
  { name: "mobile-390", width: 390, height: 844 },
  { name: "mobile-393", width: 393, height: 852 },
] as const;

for (const viewport of viewports) {
  test(`${viewport.name} keeps required hero content in the first viewport`, async ({
    page,
  }) => {
    await page.setViewportSize(viewport);
    await page.goto("/");

    const required = [
      page.getByRole("heading", {
        name: "Развод, алименты и раздел имущества в Хабаровске",
      }),
      page.getByRole("button", { name: "Получить оценку ситуации" }),
      page.getByText("Первая консультация — бесплатная.", { exact: false }),
      page.getByRole("list", { name: "Практика в цифрах" }),
    ];

    for (const locator of required) {
      await expect(locator).toBeVisible();
      const box = await locator.boundingBox();
      expect(box).not.toBeNull();
      expect((box?.y ?? 0) + (box?.height ?? 0)).toBeLessThanOrEqual(
        viewport.height + 1,
      );
    }

    const overflow = await page.evaluate(() => ({
      body: document.body.scrollWidth,
      viewport: document.documentElement.clientWidth,
    }));
    expect(overflow.body).toBeLessThanOrEqual(overflow.viewport);
  });
}

test("does not draw a divider through the hero portrait", async ({ page }) => {
  await page.goto("/");

  const borderWidth = await page.locator(".header-inner").evaluate((element) => {
    return getComputedStyle(element).borderBottomWidth;
  });
  expect(borderWidth).toBe("0px");
});
```

- [ ] **Step 2: Install browsers and confirm the layout test fails**

Run:

```bash
npx playwright install chromium webkit
npm run test:e2e -- tests/e2e/hero.spec.ts
```

Expected: FAIL because the current header has a divider and the old hero layout does not render the approved dossier inside all target viewports.

- [ ] **Step 3: Normalize section headings, remove the header line, and soften the fixed overlay**

Replace the global `h2` declaration so section headings remain below the hero's 52–96 px scale:

```css
h2 {
  max-width: 16ch;
  margin-bottom: 2rem;
  font-size: clamp(2.75rem, 5.6vw, 5rem);
  line-height: 0.92;
}
```

Replace `.site-header` and `.header-inner` declarations with:

```css
.site-header {
  position: fixed;
  z-index: 50;
  inset: 0 0 auto;
  background: linear-gradient(
    180deg,
    color-mix(in srgb, var(--token-color-accent-forest) 86%, transparent),
    color-mix(in srgb, var(--token-color-accent-forest) 62%, transparent)
  );
  color: var(--token-color-background);
}

.header-inner {
  display: flex;
  min-height: 5.5rem;
  align-items: center;
  gap: 2rem;
}
```

Do not add a border, pseudo-element, or horizontal rule under the header.

- [ ] **Step 4: Replace the hero CSS block**

Replace existing `.hero` through `.hero-disclaimer` styles with:

```css
.hero {
  position: relative;
  min-height: 100svh;
  overflow: hidden;
  background: var(--token-color-accent-forest);
  color: var(--token-color-background);
}

.hero-stage,
.hero-overlay,
.hero-case-cover {
  position: absolute;
  inset: 0;
}

.hero-stage {
  background: var(--token-color-accent-forest);
}

.hero-poster {
  z-index: 0;
  object-fit: cover;
}

.hero-stage video {
  position: absolute;
  z-index: 1;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: center;
}

.hero-abstract {
  position: absolute;
  z-index: 0;
  inset: -15%;
  background:
    radial-gradient(
      circle at 25% 30%,
      color-mix(in srgb, var(--token-color-accent-sage) 90%, transparent),
      transparent 32%
    ),
    radial-gradient(
      circle at 74% 63%,
      color-mix(in srgb, var(--token-color-text-primary) 72%, transparent),
      transparent 40%
    ),
    linear-gradient(
      145deg,
      var(--token-color-accent-forest),
      var(--token-color-text-primary)
    );
}

.hero-overlay {
  z-index: 2;
  background:
    linear-gradient(
      90deg,
      color-mix(in srgb, var(--token-color-text-primary) 88%, transparent),
      color-mix(in srgb, var(--token-color-accent-forest) 44%, transparent) 48%,
      transparent 74%
    ),
    linear-gradient(
      0deg,
      color-mix(in srgb, var(--token-color-text-primary) 30%, transparent),
      transparent 48%
    );
}

.hero-case-cover {
  z-index: 4;
  pointer-events: none;
  background: var(--token-color-accent-forest);
  transform-origin: right;
}

.hero-content {
  position: relative;
  z-index: 3;
  display: flex;
  min-height: 100svh;
  align-items: flex-start;
  padding-block: clamp(7rem, 17vh, 10rem) 11rem;
}

.hero-copy {
  width: min(53%, 46rem);
}

.hero-eyebrow {
  color: color-mix(
    in srgb,
    var(--token-color-background) 82%,
    var(--token-color-accent-sage)
  );
}

.hero h1 {
  margin-bottom: 1.15rem;
  font-size: clamp(3.25rem, 6.4vw, 6rem);
  line-height: 0.9;
}

.hero-title-line {
  display: block;
  white-space: nowrap;
}

.hero-title-place {
  color: color-mix(
    in srgb,
    var(--token-color-background) 78%,
    var(--token-color-accent-sage)
  );
  font-style: italic;
}

.hero-subtitle {
  max-width: 38rem;
  margin-bottom: 1.1rem;
  color: color-mix(
    in srgb,
    var(--token-color-background) 88%,
    var(--token-color-text-secondary)
  );
  font-size: clamp(1rem, 1.4vw, 1.2rem);
  line-height: 1.5;
}

.hero-actions {
  display: flex;
  align-items: center;
}

.hero-disclaimer {
  max-width: 32rem;
  margin: 0.75rem 0 0;
  color: color-mix(
    in srgb,
    var(--token-color-background) 74%,
    transparent
  );
  font-size: 0.68rem;
  line-height: 1.5;
}

.hero-dossier {
  position: absolute;
  z-index: 2;
  right: calc((100vw - min(100vw - 2rem, 82rem)) / -2);
  bottom: 2rem;
  width: min(58vw, 52rem);
  color: var(--token-color-text-primary);
}

.hero-dossier-rule {
  position: absolute;
  z-index: 1;
  right: calc((100vw - min(100vw - 2rem, 82rem)) / -2);
  bottom: 2rem;
  width: min(58vw, 52rem);
  height: 2px;
  background: linear-gradient(
    90deg,
    var(--token-color-accent-sage),
    transparent
  );
  transform-origin: left;
}

.hero-dossier-tab {
  display: inline-flex;
  margin-left: 0;
  border-radius: 0.65rem 0.65rem 0 0;
  padding: 0.55rem 0.9rem 0.45rem;
  background: color-mix(
    in srgb,
    var(--token-color-accent-sage) 88%,
    transparent
  );
  color: var(--token-color-background);
  font-size: 0.62rem;
  font-weight: 700;
  letter-spacing: 0.14em;
  text-transform: uppercase;
}

.hero-dossier ol {
  display: grid;
  min-height: 7.25rem;
  grid-template-columns: 0.8fr 1.35fr 0.9fr;
  overflow: hidden;
  margin: 0;
  border-radius: var(--token-radius-panel) 0 0 var(--token-radius-panel);
  padding: 0;
  background: color-mix(
    in srgb,
    var(--token-color-background) 88%,
    transparent
  );
  box-shadow: var(--token-shadow-lift);
  list-style: none;
}

.hero-dossier li {
  position: relative;
  display: grid;
  align-content: center;
  padding: 1.4rem 1.25rem 1rem;
}

.hero-dossier li + li {
  border-left: 1px solid
    color-mix(in srgb, var(--token-color-text-secondary) 15%, transparent);
}

.hero-dossier li:nth-child(2) {
  background: color-mix(
    in srgb,
    var(--token-color-accent-sage) 8%,
    transparent
  );
}

.hero-dossier li:last-child {
  background: color-mix(
    in srgb,
    var(--token-color-background) 96%,
    transparent
  );
}

.hero-metric-index {
  position: absolute;
  top: 0.75rem;
  right: 0.8rem;
  color: var(--token-color-accent-sage);
  font-size: 0.62rem;
  letter-spacing: 0.1em;
}

.hero-dossier strong {
  font-family: var(--font-cormorant), serif;
  font-size: clamp(2.2rem, 4vw, 4rem);
  font-weight: 500;
  line-height: 0.88;
}

.hero-dossier li > span:last-child {
  margin-top: 0.65rem;
  color: var(--token-color-text-secondary);
  font-size: 0.62rem;
  font-weight: 700;
  line-height: 1.3;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}
```

- [ ] **Step 5: Add mobile layout rules**

Inside the existing mobile-first base styles, append:

```css
@media (max-width: 47.999rem) {
  .hero-content {
    padding-block: 7rem 10.25rem;
  }

  .hero-copy {
    width: 100%;
  }

  .hero h1 {
    font-size: clamp(2.5rem, 10vw, 3.5rem);
    line-height: 0.92;
  }

  .hero-title-line {
    white-space: normal;
  }

  .hero-title-place {
    white-space: nowrap;
  }

  .hero-subtitle {
    max-width: 28rem;
    font-size: 0.95rem;
  }

  .hero-stage video {
    object-position: 62% center;
  }

  .hero-overlay {
    background:
      linear-gradient(
        90deg,
        color-mix(in srgb, var(--token-color-text-primary) 90%, transparent),
        color-mix(in srgb, var(--token-color-accent-forest) 56%, transparent)
      ),
      linear-gradient(
        0deg,
        color-mix(in srgb, var(--token-color-text-primary) 48%, transparent),
        transparent 55%
      );
  }

  .hero-dossier {
    right: 1rem;
    bottom: 1rem;
    left: 1rem;
    width: auto;
  }

  .hero-dossier-rule {
    right: 1rem;
    bottom: 1rem;
    left: 1rem;
    width: auto;
  }

  .hero-dossier ol {
    min-height: 6.5rem;
    border-radius: var(--token-radius-card);
  }

  .hero-dossier li {
    padding: 1.25rem 0.7rem 0.85rem;
  }

  .hero-dossier strong {
    font-size: clamp(1.9rem, 9vw, 2.5rem);
  }

  .hero-dossier li > span:last-child {
    font-size: 0.52rem;
  }
}
```

- [ ] **Step 6: Remove obsolete desktop badge positioning**

Delete the existing desktop rules:

```css
.hero-badges {
  position: absolute;
  right: 0;
  bottom: 4rem;
  display: grid;
  width: 16rem;
}
```

Also remove obsolete `.hero-badges`, `.hero-badges li`, `.mute-control`, and iframe-specific hero declarations that no longer have consumers.

- [ ] **Step 7: Preserve reduced-motion poster mode**

Inside the existing `@media (prefers-reduced-motion: reduce)` block, add:

```css
.hero-case-cover {
  display: none;
}
```

The React branch already omits video when `useReducedMotion()` is true.

- [ ] **Step 8: Run focused tests, typecheck, lint, and layout E2E**

Run:

```bash
npm test -- src/components/site/Hero.test.tsx src/components/site/site-shell.test.tsx
npm run typecheck
npm run lint
npm run test:e2e -- tests/e2e/hero.spec.ts
```

Expected: all commands exit 0 with no new warnings.

- [ ] **Step 9: Commit the visual checkpoint if authorized**

```bash
git add src/app/globals.css playwright.config.ts tests/e2e/hero.spec.ts
git commit -m "feat: style cinematic hero dossier"
```

---

### Task 6: Add browser-level viewport and reduced-motion coverage

**Files:**
- Modify: `tests/e2e/hero.spec.ts`

- [ ] **Step 1: Extend the passing layout suite with media and overlay coverage**

Replace `tests/e2e/hero.spec.ts` with:

```ts
import { expect, test } from "@playwright/test";

const viewports = [
  { name: "desktop-1366", width: 1366, height: 768 },
  { name: "desktop-1440", width: 1440, height: 900 },
  { name: "mobile-390", width: 390, height: 844 },
  { name: "mobile-393", width: 393, height: 852 },
] as const;

for (const viewport of viewports) {
  test(`${viewport.name} keeps required hero content in the first viewport`, async ({
    page,
  }) => {
    await page.setViewportSize(viewport);
    await page.goto("/");

    const required = [
      page.getByRole("heading", {
        name: "Развод, алименты и раздел имущества в Хабаровске",
      }),
      page.getByRole("button", { name: "Получить оценку ситуации" }),
      page.getByText("Первая консультация — бесплатная.", { exact: false }),
      page.getByRole("list", { name: "Практика в цифрах" }),
    ];

    for (const locator of required) {
      await expect(locator).toBeVisible();
      const box = await locator.boundingBox();
      expect(box).not.toBeNull();
      expect((box?.y ?? 0) + (box?.height ?? 0)).toBeLessThanOrEqual(
        viewport.height + 1,
      );
    }

    const overflow = await page.evaluate(() => ({
      body: document.body.scrollWidth,
      viewport: document.documentElement.clientWidth,
    }));
    expect(overflow.body).toBeLessThanOrEqual(overflow.viewport);
  });
}

test("uses a local muted loop and no header divider", async ({ page }) => {
  await page.goto("/");

  const video = page.getByTestId("hero-video");
  await expect(video).toHaveAttribute("src", "/media/artem-hero-loop.mp4");
  await expect(video).toHaveAttribute("poster", "/media/artem-hero-poster.jpg");
  await expect(video).toHaveJSProperty("muted", true);
  await expect(video).toHaveJSProperty("loop", true);

  const borderWidth = await page.locator(".header-inner").evaluate((element) => {
    return getComputedStyle(element).borderBottomWidth;
  });
  expect(borderWidth).toBe("0px");
});

test("anchors the opaque metric over the video bottom-right mark", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1366, height: 768 });
  await page.goto("/");

  const heroBox = await page.locator(".hero").boundingBox();
  const coverBox = await page
    .getByRole("list", { name: "Практика в цифрах" })
    .locator("li")
    .last()
    .boundingBox();

  expect(heroBox).not.toBeNull();
  expect(coverBox).not.toBeNull();
  expect((coverBox?.x ?? 0) + (coverBox?.width ?? 0)).toBeGreaterThanOrEqual(
    (heroBox?.x ?? 0) + (heroBox?.width ?? 0) - 2,
  );
  expect((coverBox?.y ?? 0) + (coverBox?.height ?? 0)).toBeGreaterThan(
    (heroBox?.y ?? 0) + (heroBox?.height ?? 0) - 180,
  );
});

test("shows poster-only hero with reduced motion", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");

  await expect(page.getByTestId("hero-video")).toHaveCount(0);
  await expect(page.getByTestId("hero-stage")).toHaveAttribute(
    "data-reduced-motion",
    "true",
  );
  await expect(page.getByTestId("hero-poster")).toBeVisible();
});
```

- [ ] **Step 2: Confirm Playwright browsers are available**

Run:

```bash
npx playwright install chromium webkit
```

Expected: browser binaries are installed. This is idempotent and does not add a package dependency.

- [ ] **Step 3: Run the complete Hero E2E suite**

Run:

```bash
npm run test:e2e -- tests/e2e/hero.spec.ts
```

Expected: PASS in Chromium and WebKit for every viewport, local media, overlay, and reduced-motion assertion.

- [ ] **Step 4: Commit the E2E checkpoint if authorized**

```bash
git add playwright.config.ts tests/e2e/hero.spec.ts src/app/globals.css
git commit -m "test: cover responsive hero presentation"
```

---

### Task 7: Run final verification and manual media QA

**Files:**
- Verify all modified files and assets

- [ ] **Step 1: Run focused hero and content tests**

Run:

```bash
npm test -- \
  src/components/site/Hero.test.tsx \
  src/components/site/site-shell.test.tsx \
  src/modules/content/content.schemas.test.ts \
  src/modules/content/landing-data.service.test.ts \
  src/app/api/landing-data/route.test.ts
```

Expected: PASS with zero failed tests.

- [ ] **Step 2: Run the complete verification suite**

Run sequentially:

```bash
npm test
npm run typecheck
npm run lint
npm run build
npm run test:e2e
```

Expected: every command exits 0. Report any existing warning separately; do not describe a warning as a pass condition.

- [ ] **Step 3: Verify media delivery from the built app**

With the app running, execute:

```bash
curl -I "http://127.0.0.1:3000/media/artem-hero-loop.mp4"
curl -I "http://127.0.0.1:3000/media/artem-hero-poster.jpg"
```

Expected: HTTP 200 with video and JPEG content types.

- [ ] **Step 4: Perform manual macOS browser checks**

Check Chrome and Safari at:

- 1440×900 desktop;
- 1366×768 desktop;
- responsive 390×844;
- responsive 393×852;
- reduced-motion enabled in macOS accessibility settings.

Verify:

- no header divider crosses the face;
- title is exactly three semantic lines on desktop;
- `в Хабаровске` remains together;
- CTA, disclaimer, and metrics are inside the initial viewport;
- dossier covers the AI mark throughout the video;
- loop boundary has no visible scene jump;
- poster remains stable before video and with reduced motion;
- no horizontal overflow;
- modal opens and receives keyboard focus.

- [ ] **Step 5: Review the final diff**

Run:

```bash
git status --short
git diff --check
git diff -- \
  src/modules/content/content.schemas.ts \
  src/db/seed-data.ts \
  src/components/site/Hero.tsx \
  src/app/globals.css \
  tests/e2e/hero.spec.ts
```

Expected: only scoped hero/media/test changes, no whitespace errors, no secrets, no generated reports.

- [ ] **Step 6: Create the final commit only if explicitly authorized**

```bash
git add \
  public/media/artem-hero-loop.mp4 \
  public/media/artem-hero-poster.jpg \
  src/modules/content/content.schemas.ts \
  src/modules/content/content.schemas.test.ts \
  src/db/seed-data.ts \
  src/modules/content/landing-data.service.test.ts \
  src/app/api/landing-data/route.test.ts \
  src/components/site/Hero.tsx \
  src/components/site/Hero.test.tsx \
  src/components/site/site-shell.test.tsx \
  src/app/globals.css \
  playwright.config.ts \
  tests/e2e/hero.spec.ts
git commit -m "feat: add cinematic video hero dossier"
```
