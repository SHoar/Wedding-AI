import { render, screen, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { TasksPage } from "./TasksPage";

vi.mock("../hooks/useApi", () => ({
  useApi: () => ({
    getTasks: vi.fn().mockResolvedValue([]),
    addTask: vi.fn().mockResolvedValue({}),
    updateTask: vi.fn().mockResolvedValue({}),
  }),
}));

describe("TasksPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders without crashing", async () => {
    render(<TasksPage />);
    await waitFor(() => {
      expect(
        screen.getByRole("heading", { name: /Tasks/i })
      ).toBeInTheDocument();
    });
  });
});
