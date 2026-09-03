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
      page.getByRole("button", { name: "Получить оценку ситуации" }),
      page.getByText("Опишите ваш вопрос — оценю перспективы и подскажу возможные действия.", {
        exact: false,
      }),
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

test("keeps header CTA on the content column and docks dossier to the viewport", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/");

  const alignment = await page.evaluate(() => {
    const dossier = document.querySelector(".hero-dossier");
    const copy = document.querySelector(".hero-copy");
    const headerInner = document.querySelector(".header-inner");
    const headerCta = document.querySelector(".header-cta");
    const column = document.querySelector(".services.section");
    if (!dossier || !copy || !headerInner || !headerCta || !column) {
      return null;
    }

    const dossierBox = dossier.getBoundingClientRect();
    const copyBox = copy.getBoundingClientRect();
    const headerBox = headerInner.getBoundingClientRect();
    const ctaBox = headerCta.getBoundingClientRect();
    const columnBox = column.getBoundingClientRect();

    return {
      copyLeft: copyBox.left,
      ctaRight: ctaBox.right,
      columnLeft: columnBox.left,
      columnRight: columnBox.right,
      dossierRight: dossierBox.right,
      headerRight: headerBox.right,
      viewportWidth: window.innerWidth,
    };
  });

  expect(alignment).not.toBeNull();
  expect(
    Math.abs(
      (alignment?.dossierRight ?? 0) - (alignment?.viewportWidth ?? 0),
    ),
  ).toBeLessThan(2);
  expect(
    Math.abs((alignment?.headerRight ?? 0) - (alignment?.columnRight ?? 0)),
  ).toBeLessThan(2);
  expect(alignment?.ctaRight).toBeLessThanOrEqual(
    (alignment?.columnRight ?? 0) + 1,
  );
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
  await expect(video).toHaveAttribute("poster", "/media/artem-hero-poster.jpg");
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
