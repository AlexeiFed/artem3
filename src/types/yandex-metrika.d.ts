export {};

declare global {
  interface Window {
    ym?: (
      counterId: number,
      method: "reachGoal",
      goal: "lead_success" | "practice_view" | "contacts_view",
    ) => void;
  }
}
