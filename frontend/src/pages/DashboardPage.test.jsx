import { render, screen, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { DashboardPage } from "./DashboardPage";

vi.mock("../hooks/useApi", () => ({
  useApi: () => ({
    getGuests: vi.fn().mockResolvedValue([]),
    getTasks: vi.fn().mockResolvedValue([]),
    getGuestbookEntries: vi.fn().mockResolvedValue([]),
  }),
}));

vi.mock("../hooks/useActiveWeddingId", () => ({
  useActiveWeddingId: () => ({
    weddingId: 1,
    isLoading: false,
    error: "",
  }),
}));

describe("DashboardPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders without crashing", async () => {
    render(<DashboardPage />);
    await waitFor(() => {
      expect(screen.getByText("Ceremony")).toBeInTheDocument();
    });
  });

  it("renders timeline section", () => {
    render(<DashboardPage />);
    expect(screen.getByText("Ceremony")).toBeInTheDocument();
  });
});
