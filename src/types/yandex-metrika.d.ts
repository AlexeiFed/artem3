export {};

declare global {
  interface Window {
    ym?: (
      counterId: number,
      method: "reachGoal",
      goal: "lead_success",
    ) => void;
  }
}
