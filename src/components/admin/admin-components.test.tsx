// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";

import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { EntityEditor } from "./EntityEditor";

afterEach(cleanup);

describe("EntityEditor", () => {
  it("does not persist a dirty form until Save is clicked", async () => {
    const onSave = vi.fn().mockResolvedValue(undefined);

    render(
      <EntityEditor
        title="Услуга"
        initialValue={{ description: "Базовый текст" }}
        fields={[
          {
            name: "description",
            label: "Описание",
            type: "textarea",
          },
        ]}
        onSave={onSave}
      />,
    );

    fireEvent.change(screen.getByLabelText("Описание"), {
      target: { value: "Базовый текст Дополнение" },
    });
    expect(onSave).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole("button", { name: "Сохранить" }));
    expect(onSave).toHaveBeenCalledTimes(1);
    expect(onSave).toHaveBeenCalledWith({
      description: "Базовый текст Дополнение",
    });
  });
});
