import { render, screen, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { GuestbookPage } from "./GuestbookPage";

vi.mock("../hooks/useApi", () => ({
  useApi: () => ({
    getGuestbookEntries: vi.fn().mockResolvedValue([]),
    addGuestbookEntry: vi.fn().mockResolvedValue({}),
  }),
}));

vi.mock("../hooks/useActiveWeddingId", () => ({
  useActiveWeddingId: () => ({
    weddingId: 1,
    isLoading: false,
    error: "",
  }),
}));

describe("GuestbookPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders without crashing", async () => {
    render(<GuestbookPage />);
    await waitFor(() => {
      expect(
        screen.getByRole("heading", { name: /Guestbook/i })
      ).toBeInTheDocument();
    });
  });
});
