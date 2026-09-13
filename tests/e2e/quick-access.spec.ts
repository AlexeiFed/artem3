import { expect, test } from "@playwright/test";

async function cardRowSignature(page: import("@playwright/test").Page) {
  return page.locator(".quick-card").evaluateAll((cards) =>
    cards.map((card) => Math.round(card.getBoundingClientRect().top)),
  );
}

test("stacks quick cards in a single column on mobile", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");

  const tops = await cardRowSignature(page);
  expect(tops.length).toBeGreaterThan(1);
  for (let index = 1; index < tops.length; index += 1) {
    expect(tops[index] ?? 0).toBeGreaterThan((tops[index - 1] ?? 0) + 40);
  }
});

test("places quick cards in two columns on tablet", async ({ page }) => {
  await page.setViewportSize({ width: 768, height: 1024 });
  await page.goto("/");

  const tops = await cardRowSignature(page);
  expect(tops.length).toBeGreaterThan(1);
  expect(tops[0]).toBe(tops[1]);
  if (tops.length > 2) {
    expect(tops[2] ?? 0).toBeGreaterThan((tops[0] ?? 0) + 40);
  }
});

test("keeps three quick cards on the first desktop row", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/");

  const tops = await cardRowSignature(page);
  expect(tops.length).toBeGreaterThanOrEqual(3);
  expect(tops[0]).toBe(tops[1]);
  expect(tops[1]).toBe(tops[2]);
  expect((tops[3] ?? 0) - (tops[0] ?? 0)).toBeGreaterThan(40);
});
