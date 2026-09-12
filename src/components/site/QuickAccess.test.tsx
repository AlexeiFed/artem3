// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";

import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { getPreviewLandingData } from "@/modules/content/preview-landing-data";

import { QuickAccess } from "./QuickAccess";

afterEach(cleanup);

describe("QuickAccess", () => {
  it("fills cards with icon, number, two short situations and Подробнее", () => {
    const data = getPreviewLandingData();
    render(
      <QuickAccess items={data.quickLinks} services={data.services} />,
    );

    const razvod = screen.getByRole("link", { name: /Расторжение брака/u });
    expect(razvod).toHaveAttribute("href", "#razvod");
    expect(razvod.querySelector(".service-icon")).toBeTruthy();
    expect(razvod).toHaveTextContent("01");
    expect(razvod).toHaveTextContent("Без согласия супруга");
    expect(razvod).toHaveTextContent("При наличии детей");
    expect(razvod).toHaveTextContent("Подробнее");
    expect(razvod.querySelector(".quick-card-more-label")).toHaveTextContent(
      "Подробнее",
    );
    expect(razvod.querySelector(".quick-card-arrow")).toHaveTextContent("→");
    expect(razvod.textContent).not.toMatch(/•/u);
    expect(razvod).not.toHaveTextContent(
      "Развод без согласия супруга",
    );

    expect(
      screen.getByRole("link", { name: /Алименты/u }),
    ).toHaveTextContent("Изменение размера");
    expect(
      screen.getByRole("link", { name: /Раздел имущества/u }),
    ).toHaveTextContent("Ипотека и общие долги");
    expect(
      screen.getByRole("link", { name: /Споры о детях/u }),
    ).toHaveTextContent("Порядок общения");
    expect(
      screen.getByRole("link", { name: /Земельные споры/u }),
    ).toHaveTextContent("Оформление участка");
    expect(
      screen.getByRole("link", { name: /Дополнительные услуги/u }),
    ).toHaveTextContent("Подготовка документов");
    expect(document.querySelectorAll(".quick-card")).toHaveLength(
      data.quickLinks.length,
    );
  });

  it("renders admin card preview lines instead of hardcoded copy", () => {
    const data = getPreviewLandingData();
    const custom = {
      ...data,
      services: data.services.map((service) =>
        service.slug === "razvod"
          ? {
              ...service,
              previewSituations: ["Кастомная строка 1", "Кастомная строка 2"] as [
                string,
                string,
              ],
            }
          : service,
      ),
    };

    render(
      <QuickAccess items={custom.quickLinks} services={custom.services} />,
    );

    const razvod = screen.getByRole("link", { name: /Расторжение брака/u });
    expect(razvod).toHaveTextContent("Кастомная строка 1");
    expect(razvod).toHaveTextContent("Кастомная строка 2");
    expect(razvod).not.toHaveTextContent("Без согласия супруга");
  });

  it("keeps Подробнее when a slug has no preview copy", () => {
    render(
      <QuickAccess
        items={[
          { slug: "zemlya", label: "Земельные споры", href: "#zemlya" },
        ]}
        services={[]}
      />,
    );

    const card = screen.getByRole("link", { name: /Земельные споры/u });
    expect(card).toHaveTextContent("Подробнее");
    expect(card).not.toHaveTextContent("Без согласия супруга");
  });

  it("renders admin brass markup inside card preview lines", () => {
    const data = getPreviewLandingData();
    const custom = {
      ...data,
      services: data.services.map((service) =>
        service.slug === "razvod"
          ? {
              ...service,
              previewSituations: [
                '<span class="text-brass">без согласия</span> супруга',
                "При наличии детей",
              ] as [string, string],
            }
          : service,
      ),
    };

    render(
      <QuickAccess items={custom.quickLinks} services={custom.services} />,
    );

    const razvod = screen.getByRole("link", { name: /Расторжение брака/u });
    const highlight = razvod.querySelector(".quick-card-situations .text-brass");
    expect(highlight).toHaveTextContent("без согласия");
    expect(razvod).toHaveTextContent("без согласия супруга");
    expect(razvod.innerHTML).not.toContain("onclick");
  });
});
