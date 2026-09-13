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
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/");

    const required = [
      page.getByRole("heading", {
        name: "Развод, алименты и раздел имущества в Хабаровске",
      }),
      page.locator("#main").getByRole("button", {
        name: "Получить оценку ситуации",
      }),
      page.getByText("Оценю вашу ситуацию.", { exact: false }),
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

    const dossier = page.locator(".hero-dossier");
    const dossierBox = await dossier.boundingBox();
    expect(dossierBox).not.toBeNull();
    expect((dossierBox?.y ?? 0) + (dossierBox?.height ?? 0)).toBeLessThanOrEqual(
      viewport.height + 1,
    );

    const widths = await page.evaluate(() => ({
      content: document.documentElement.scrollWidth,
      viewport: document.documentElement.clientWidth,
    }));
    expect(widths.content).toBeLessThanOrEqual(widths.viewport);
  });
}

test("keeps the metrics plate inside a shorter visual viewport on mobile", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");

  await page.evaluate(() => {
    Object.defineProperty(window, "visualViewport", {
      configurable: true,
      value: {
        get height() {
          return 400;
        },
        width: 390,
        offsetTop: 0,
        offsetLeft: 0,
        scale: 1,
        addEventListener() {},
        removeEventListener() {},
        dispatchEvent() {
          return true;
        },
      },
    });
    window.dispatchEvent(new Event("resize"));
  });

  const metrics = await page.locator(".hero").evaluate((hero) => {
    const dossier = document.querySelector(".hero-dossier");
    const next = document.querySelector(".quick-grid");
    if (!dossier || !next) return null;
    return {
      heroHeight: hero.getBoundingClientRect().height,
      dossierBottom: dossier.getBoundingClientRect().bottom,
      nextTop: next.getBoundingClientRect().top,
      minHeight: getComputedStyle(hero).minHeight,
    };
  });

  expect(metrics).not.toBeNull();
  expect(metrics?.heroHeight ?? 0).toBeGreaterThanOrEqual(844 - 1);
  expect(metrics?.minHeight).toBe("844px");
  expect(metrics?.dossierBottom ?? 0).toBeLessThanOrEqual(844 + 1);
  expect(metrics?.nextTop ?? 0).toBeGreaterThanOrEqual(844 - 1);
});

test("keeps a chrome gutter under the metrics plate on mobile", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");

  const metrics = await page.evaluate(() => {
    const content = document.querySelector(".hero-content");
    const dossier = document.querySelector(".hero-dossier");
    const disclaimer = document.querySelector(".hero-disclaimer");
    const fab = document.querySelector(".floating-actions");
    if (!content || !dossier || !disclaimer || !fab) return null;
    const contentStyle = getComputedStyle(content);
    const dossierStyle = getComputedStyle(dossier);
    const fabStyle = getComputedStyle(fab);
    return {
      paddingBottom: Number.parseFloat(contentStyle.paddingBottom),
      dossierPosition: dossierStyle.position,
      dossierCssBottom: Number.parseFloat(dossierStyle.bottom),
      fabCssBottom: Number.parseFloat(fabStyle.bottom),
      dossierBottom: dossier.getBoundingClientRect().bottom,
      plateGap:
        dossier.getBoundingClientRect().top -
        disclaimer.getBoundingClientRect().bottom,
      fabVisible: Boolean(document.querySelector(".contact-fab")),
    };
  });

  expect(metrics).not.toBeNull();
  expect(metrics?.dossierPosition).toBe("absolute");
  expect(metrics?.dossierCssBottom ?? 0).toBeGreaterThanOrEqual(36);
  expect(metrics?.dossierCssBottom ?? 0).toBeLessThan(56);
  expect(metrics?.fabCssBottom ?? 0).toBeLessThan(32);
  expect(metrics?.fabVisible).toBe(false);
  expect(metrics?.paddingBottom ?? 0).toBeGreaterThanOrEqual(160);
  expect(metrics?.plateGap ?? 0).toBeGreaterThanOrEqual(48);
  expect(metrics?.dossierBottom ?? 0).toBeGreaterThan(844 - 56);
  expect(metrics?.dossierBottom ?? 0).toBeLessThanOrEqual(844 - 32);
});

test("does not stretch the hero past svh when the visual viewport is larger", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");

  await page.evaluate(() => {
    Object.defineProperty(window, "visualViewport", {
      configurable: true,
      value: {
        get height() {
          return 920;
        },
        width: 390,
        offsetTop: 0,
        offsetLeft: 0,
        scale: 1,
        addEventListener() {},
        removeEventListener() {},
        dispatchEvent() {
          return true;
        },
      },
    });
    window.dispatchEvent(new Event("resize"));
  });

  await expect
    .poll(async () =>
      page.locator(".hero").evaluate((hero) =>
        Math.round(hero.getBoundingClientRect().height),
      ),
    )
    .toBeLessThanOrEqual(844 + 1);

  const dossierBottom = await page.locator(".hero-dossier").evaluate((element) => {
    return element.getBoundingClientRect().bottom;
  });
  expect(dossierBottom).toBeLessThanOrEqual(844 + 1);
});

test("keeps the desktop metrics plate inside a shorter visual viewport", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");

  await page.evaluate(() => {
    Object.defineProperty(window, "visualViewport", {
      configurable: true,
      value: {
        get height() {
          return 760;
        },
        width: 1440,
        offsetTop: 0,
        offsetLeft: 0,
        scale: 1,
        addEventListener() {},
        removeEventListener() {},
        dispatchEvent() {
          return true;
        },
      },
    });
    window.dispatchEvent(new Event("resize"));
  });

  await expect
    .poll(async () =>
      page.locator(".hero-dossier").evaluate((element) => {
        return element.getBoundingClientRect().bottom;
      }),
    )
    .toBeLessThanOrEqual(760 + 1);
});

test("shifts desktop nav toward the phone while the header CTA is hidden", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");

  const overHeroNavRight = await page.locator(".desktop-nav").evaluate((el) => {
    return el.getBoundingClientRect().right;
  });

  await page.locator("#uslugi").scrollIntoViewIfNeeded();
  await expect(page.locator(".header-cta")).toHaveCSS("display", "block");

  const afterScrollNavRight = await page
    .locator(".desktop-nav")
    .evaluate((el) => el.getBoundingClientRect().right);

  expect(overHeroNavRight).toBeGreaterThan(afterScrollNavRight + 40);
});

test("hides the header CTA until the hero leaves the viewport", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");

  const cta = page.locator(".header-cta");
  await expect(cta).toHaveCSS("display", "none");

  await page.locator("#uslugi").scrollIntoViewIfNeeded();
  await expect(cta).toHaveCSS("display", "block");
  await expect(cta).toHaveCSS("visibility", "visible");
});

test("aligns header, dossier and sections to the content column", async ({
  page,
}) => {
  for (const viewport of [
    { width: 1366, height: 768 },
    { width: 1440, height: 900 },
    { width: 1920, height: 1080 },
  ] as const) {
    await page.setViewportSize(viewport);
    await page.goto("/");

    const alignment = await page.evaluate(() => {
      const dossier = document.querySelector(".hero-dossier");
      const copy = document.querySelector(".hero-copy");
      const logo = document.querySelector(".logo");
      const headerInner = document.querySelector(".header-inner");
      const column = document.querySelector(".quick.section, .services.section");
      const rail = document.querySelector(".contact-rail");
      if (!dossier || !copy || !logo || !headerInner || !column || !rail) {
        return null;
      }

      const dossierBox = dossier.getBoundingClientRect();
      const copyBox = copy.getBoundingClientRect();
      const logoBox = logo.getBoundingClientRect();
      const headerBox = headerInner.getBoundingClientRect();
      const columnBox = column.getBoundingClientRect();
      const railBox = rail.getBoundingClientRect();

      return {
        copyLeft: copyBox.left,
        logoLeft: logoBox.left,
        columnLeft: columnBox.left,
        columnRight: columnBox.right,
        dossierRight: dossierBox.right,
        railLeft: railBox.left,
        railRight: railBox.right,
        headerLeft: headerBox.left,
        headerRight: headerBox.right,
        viewportWidth: window.innerWidth,
      };
    });

    expect(alignment, `${viewport.width}x${viewport.height}`).not.toBeNull();
    expect(
      Math.abs((alignment?.headerLeft ?? 0) - (alignment?.columnLeft ?? 0)),
      `${viewport.width} header/column left`,
    ).toBeLessThan(2);
    expect(
      Math.abs((alignment?.logoLeft ?? 0) - (alignment?.columnLeft ?? 0)),
      `${viewport.width} logo/column left`,
    ).toBeLessThan(2);
    expect(
      Math.abs((alignment?.copyLeft ?? 0) - (alignment?.columnLeft ?? 0)),
      `${viewport.width} copy/column left`,
    ).toBeLessThan(2);
    expect(
      Math.abs((alignment?.headerRight ?? 0) - (alignment?.columnRight ?? 0)),
      `${viewport.width} header/column right`,
    ).toBeLessThan(2);
    expect(
      Math.abs(
        (alignment?.columnLeft ?? 0) -
          ((alignment?.viewportWidth ?? 0) - (alignment?.columnRight ?? 0)),
      ),
      `${viewport.width} symmetric gutters`,
    ).toBeLessThan(2);
    expect(
      (alignment?.railLeft ?? 0) - (alignment?.columnRight ?? 0),
      `${viewport.width} rail gap from column`,
    ).toBeGreaterThan(12);
    expect(
      Math.abs(
        (alignment?.dossierRight ?? 0) - ((alignment?.viewportWidth ?? 0) - 20),
      ),
      `${viewport.width} dossier at rail inset`,
    ).toBeLessThan(2);
    expect(
      Math.abs(
        (alignment?.railRight ?? 0) - ((alignment?.viewportWidth ?? 0) - 20),
      ),
      `${viewport.width} rail at 1.25rem`,
    ).toBeLessThan(2);
  }
});

test("does not draw a divider through the hero portrait", async ({ page }) => {
  await page.goto("/");

  const borderWidth = await page.locator(".header-inner").evaluate((element) => {
    return getComputedStyle(element).borderBottomWidth;
  });
  expect(borderWidth).toBe("0px");
});

test("uses the local muted loop", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.goto("/");

  const video = page.getByTestId("hero-video");
  await expect(video).toHaveAttribute("src", "/media/artem-hero-loop.mp4");
  await expect(video).not.toHaveAttribute("poster");
  await expect(video).toHaveAttribute("preload", "metadata");
  await expect(video).toHaveJSProperty("muted", true);
  await expect(video).toHaveJSProperty("loop", true);
});

test("covers the fixed AI mark throughout the video loop", async ({
  browserName,
  page,
}) => {
  test.skip(
    browserName === "webkit",
    "Playwright WebKit does not provide reliable H.264 seeking on macOS",
  );

  for (const viewport of [
    { width: 1366, height: 768 },
    { width: 1440, height: 900 },
  ] as const) {
    await page.setViewportSize(viewport);
    await page.emulateMedia({ reducedMotion: "no-preference" });
    await page.goto("/");

    const video = page.getByTestId("hero-video");

    await expect
      .poll(() =>
        video.evaluate((element) =>
          element instanceof HTMLVideoElement ? element.videoWidth : 0,
        ),
      )
      .toBe(1280);

    for (const time of [0.2, 4.5, 8.8]) {
      await video.evaluate(async (element, nextTime) => {
        if (!(element instanceof HTMLVideoElement)) {
          throw new Error("Hero media is not a video element");
        }
        element.currentTime = nextTime;
        await new Promise<void>((resolve) => {
          element.addEventListener("seeked", () => resolve(), { once: true });
        });
      }, time);

      const markCoverage = await page.evaluate(
        ({ sourceX, sourceY }) => {
          const videoElement = document.querySelector<HTMLVideoElement>(
            '[data-testid="hero-video"]',
          );
          const coverElement = document.querySelector<HTMLElement>(
            ".hero-dossier li:last-child",
          );
          if (!videoElement || !coverElement) {
            return { covered: false, reason: "missing element" };
          }

          const videoBox = videoElement.getBoundingClientRect();
          const coverBox = coverElement.getBoundingClientRect();
          const scale = Math.max(
            videoBox.width / videoElement.videoWidth,
            videoBox.height / videoElement.videoHeight,
          );
          const renderedWidth = videoElement.videoWidth * scale;
          const renderedHeight = videoElement.videoHeight * scale;
          const pointX =
            videoBox.left +
            (videoBox.width - renderedWidth) / 2 +
            sourceX * scale;
          const pointY =
            videoBox.top +
            (videoBox.height - renderedHeight) / 2 +
            sourceY * scale;
          const background = getComputedStyle(coverElement).backgroundColor;

          const covered =
            pointX >= coverBox.left &&
            pointX <= coverBox.right &&
            pointY >= coverBox.top &&
            pointY <= coverBox.bottom &&
            background !== "transparent" &&
            background !== "rgba(0, 0, 0, 0)";

          return {
            background,
            cover: {
              bottom: coverBox.bottom,
              left: coverBox.left,
              right: coverBox.right,
              top: coverBox.top,
            },
            covered,
            point: { x: pointX, y: pointY },
          };
        },
        { sourceX: 1168, sourceY: 632 },
      );

      expect(
        markCoverage.covered,
        `${viewport.width}x${viewport.height} t=${time} ${JSON.stringify(markCoverage)}`,
      ).toBe(true);
    }
  }
});

test("keeps the poster when the video request fails", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.route("**/media/artem-hero-loop.mp4", (route) => route.abort());
  await page.goto("/");

  await expect(page.getByTestId("hero-poster")).toBeVisible();
});

test("uses the abstract fallback when both media requests fail", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.route("**/media/artem-hero-loop.mp4", (route) => route.abort());
  await page.route(/artem-hero-poster\.jpg/u, (route) =>
    route.fulfill({ status: 404, body: "" }),
  );
  await page.goto("/");

  await expect
    .poll(async () => {
      const poster = page.getByTestId("hero-poster");
      if ((await poster.count()) === 0) return true;
      return poster.evaluate(
        (element) =>
          element instanceof HTMLImageElement && element.naturalWidth === 0,
      );
    })
    .toBe(true);
  await expect(page.getByTestId("hero-abstract")).toBeVisible();
});

test("shows poster-only hero with reduced motion", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");

  expect(
    await page.evaluate(
      () => window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    ),
  ).toBe(true);
  await expect(page.getByTestId("hero-video")).toHaveCount(0);
  await expect(page.getByTestId("hero-stage")).toHaveAttribute(
    "data-reduced-motion",
    "true",
  );
  await expect(page.getByTestId("hero-poster")).toBeVisible();
});
