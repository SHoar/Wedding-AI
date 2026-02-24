import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { AIQnAPage } from "./AIQnAPage";

const mockAskWeddingAI = vi.fn();
const mockGetPrimaryWeddingId = vi.fn();

vi.mock("../hooks/useApi", () => ({
  useApi: () => ({
    askWeddingAI: mockAskWeddingAI,
    getPrimaryWeddingId: mockGetPrimaryWeddingId,
  }),
}));

vi.mock("../hooks/useActiveWeddingId", () => ({
  useActiveWeddingId: () => ({
    weddingId: 1,
    isLoading: false,
    error: "",
  }),
}));

function wrapper({ children }) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}

describe("AIQnAPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders heading and form", () => {
    render(<AIQnAPage />, { wrapper });

    expect(
      screen.getByRole("heading", { name: /Ask Wedding AI/i })
    ).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Ask about venue/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Ask AI/i })).toBeInTheDocument();
  });

  it("submit asks AI and shows answer", async () => {
    const user = userEvent.setup();
    mockAskWeddingAI.mockResolvedValueOnce("Guests should arrive by 3 PM.");

    render(<AIQnAPage />, { wrapper });

    const textarea = screen.getByPlaceholderText(/Ask about venue/);
    await user.type(textarea, "What time should guests arrive?");
    await user.click(screen.getByRole("button", { name: /Ask AI/i }));

    await waitFor(() => {
      expect(mockAskWeddingAI).toHaveBeenCalledWith(
        1,
        "What time should guests arrive?"
      );
    });
    await waitFor(() => {
      expect(
        screen.getByText(/Guests should arrive by 3 PM\./)
      ).toBeInTheDocument();
    });
  });

  it("shows error when ask fails", async () => {
    const user = userEvent.setup();
    mockAskWeddingAI.mockRejectedValueOnce(new Error("Service unavailable"));

    render(<AIQnAPage />, { wrapper });

    await user.type(screen.getByPlaceholderText(/Ask about venue/), "Hi");
    await user.click(screen.getByRole("button", { name: /Ask AI/i }));

    await waitFor(() => {
      expect(
        screen.getByText(/Service unavailable|Unable to get an answer/)
      ).toBeInTheDocument();
    });
  });

  it("disables submit when question is empty", () => {
    render(<AIQnAPage />, { wrapper });

    const button = screen.getByRole("button", { name: /Ask AI/i });
    expect(button).toBeDisabled();
  });

  it("shows prompt suggestions that fill the textarea when clicked", async () => {
    const user = userEvent.setup();
    render(<AIQnAPage />, { wrapper });

    const suggestion = screen.getByText(/What time should guests arrive/);
    await user.click(suggestion);

    const textarea = screen.getByPlaceholderText(/Ask about venue/);
    expect(textarea).toHaveValue(
      "What time should guests arrive for the ceremony?"
    );
  });
});
