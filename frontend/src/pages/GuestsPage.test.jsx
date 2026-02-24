import { render, screen, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { GuestsPage } from "./GuestsPage";

vi.mock("../hooks/useApi", () => ({
  useApi: () => ({
    getGuests: vi.fn().mockResolvedValue([]),
    addGuest: vi.fn().mockResolvedValue({}),
  }),
}));

describe("GuestsPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders without crashing", async () => {
    render(<GuestsPage />);
    await waitFor(() => {
      expect(
        screen.getByRole("heading", { name: "Guest list" })
      ).toBeInTheDocument();
    });
  });

  it("shows add guest form", () => {
    render(<GuestsPage />);
    expect(screen.getByPlaceholderText("Taylor Morgan")).toBeInTheDocument();
  });
});
