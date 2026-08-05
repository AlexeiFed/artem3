// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";

import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { getPreviewLandingData } from "@/modules/content/preview-landing-data";

import { ContractXRay } from "./ContractXRay";

afterEach(cleanup);

describe("ContractXRay", () => {
  it("toggles full desktop-like reveal via a button", () => {
    const data = getPreviewLandingData().hiddenRisks;

    render(<ContractXRay data={data} />);

    const documentCard = screen.getByLabelText(/Документ с выделенными/i);
    const toggle = screen.getByRole("button", {
      name: "Показать опасные условия",
    });

    expect(documentCard).not.toHaveClass("is-fully-revealed");

    fireEvent.click(toggle);
    expect(documentCard).toHaveClass("is-revealed");
    expect(documentCard).toHaveClass("is-fully-revealed");
    expect(
      screen.getByRole("button", { name: "Скрыть опасные условия" }),
    ).toBeInTheDocument();

    fireEvent.click(
      screen.getByRole("button", { name: "Скрыть опасные условия" }),
    );
    expect(documentCard).not.toHaveClass("is-fully-revealed");
  });
});
