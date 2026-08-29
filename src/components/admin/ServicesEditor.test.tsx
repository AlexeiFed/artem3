// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";

import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { ServicesEditor, type ServiceEditorItem } from "./ServicesEditor";

afterEach(cleanup);

const item: ServiceEditorItem = {
  id: "10000000-0000-4000-8000-000000000001",
  slug: "razvod",
  title: "Расторжение брака",
  description: "Развод в Хабаровске — без конфликтов и лишних судов",
  situations: [
    "Развод без согласия супруга",
    "Развод при наличии несовершеннолетних детей",
    "Супруг не выходит на связь или находится в другом городе",
  ],
  trustNote: "Короткое пояснение для клиента.",
  priceFromKopecks: 2_500_000,
  isHighValue: false,
  isHidden: false,
  ctaLabel: "Получить оценку ситуации",
  iconUrl: null,
};

describe("ServicesEditor", () => {
  it("offers an icon path field and a file uploader", () => {
    render(<ServicesEditor initialItems={[item]} loadError={null} />);

    expect(screen.getByLabelText("Иконка (/media/...)")).toBeInTheDocument();
    expect(
      screen.getByLabelText("Загрузка файла (локально или S3)"),
    ).toBeInTheDocument();
  });

  it("resets the file input when switching to another service", () => {
    const second: ServiceEditorItem = {
      ...item,
      id: "10000000-0000-4000-8000-000000000002",
      slug: "alimenty",
      title: "Алименты",
    };
    render(<ServicesEditor initialItems={[item, second]} loadError={null} />);

    expect(screen.getByLabelText("Загрузка файла (локально или S3)")).toHaveAttribute(
      "id",
      `service-icon-upload-${item.id}`,
    );

    fireEvent.click(screen.getByRole("button", { name: "Алименты" }));

    expect(screen.getByLabelText("Название")).toHaveValue("Алименты");
    const input = screen.getByLabelText("Загрузка файла (локально или S3)");
    expect(input).toHaveAttribute("id", `service-icon-upload-${second.id}`);
    expect(input).not.toBeDisabled();
  });
});
