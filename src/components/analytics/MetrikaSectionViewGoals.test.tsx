// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";

import { act, cleanup, render } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { MetrikaSectionViewGoals } from "./MetrikaSectionViewGoals";

let observerCallback: IntersectionObserverCallback | undefined;

class IntersectionObserverStub {
  readonly root = null;
  readonly rootMargin = "";
  readonly thresholds = [0];

  constructor(callback: IntersectionObserverCallback) {
    observerCallback = callback;
  }

  observe() {}
  unobserve() {}
  disconnect() {}
  takeRecords(): IntersectionObserverEntry[] {
    return [];
  }
}

function entry(id: string, isIntersecting: boolean): IntersectionObserverEntry {
  const target = document.getElementById(id);
  if (!target) throw new Error(`Missing #${id}`);
  return { isIntersecting, target } as unknown as IntersectionObserverEntry;
}

function show(id: string) {
  act(() => {
    observerCallback?.(
      [entry(id, true)],
      {} as IntersectionObserver,
    );
  });
}

afterEach(() => {
  cleanup();
  document.body.replaceChildren();
  observerCallback = undefined;
  delete window.ym;
  vi.useRealTimers();
});

describe("MetrikaSectionViewGoals", () => {
  it("sends practice and contacts goals with the given counter id, once", () => {
    vi.stubGlobal("IntersectionObserver", IntersectionObserverStub);
    window.ym = vi.fn();
    document.body.innerHTML =
      '<section id="practice"></section><section id="contacts"></section>';

    render(<MetrikaSectionViewGoals counterId={111} />);
    show("practice");
    show("practice");
    show("contacts");

    expect(window.ym).toHaveBeenCalledTimes(2);
    expect(window.ym).toHaveBeenNthCalledWith(1, 111, "reachGoal", "practice_view");
    expect(window.ym).toHaveBeenNthCalledWith(2, 111, "reachGoal", "contacts_view");
  });

  it("queues a visible block until ym exists", () => {
    vi.useFakeTimers();
    vi.stubGlobal("IntersectionObserver", IntersectionObserverStub);
    document.body.innerHTML = '<section id="practice"></section>';

    render(<MetrikaSectionViewGoals counterId={222} />);
    show("practice");
    expect(window.ym).toBeUndefined();

    window.ym = vi.fn();
    act(() => {
      vi.advanceTimersByTime(300);
    });

    expect(window.ym).toHaveBeenCalledTimes(1);
    expect(window.ym).toHaveBeenCalledWith(222, "reachGoal", "practice_view");
  });
});
