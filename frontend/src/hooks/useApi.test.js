import { renderHook } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { useApi } from "./useApi";

const mockGet = vi.hoisted(() => vi.fn());
const mockPost = vi.hoisted(() => vi.fn());
const mockPatch = vi.hoisted(() => vi.fn());

vi.mock("axios", () => ({
  default: {
    create: vi.fn(() => ({
      get: mockGet,
      post: mockPost,
      patch: mockPatch,
      interceptors: { request: { use: vi.fn() } },
    })),
    isAxiosError: (e) => Boolean(e?.isAxiosError),
  },
}));

describe("useApi", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("exposes askWeddingAI that POSTs to /api/weddings/:id/ask and returns answer", async () => {
    mockPost.mockResolvedValueOnce({ data: { answer: "Arrive by 3 PM." } });

    const { result } = renderHook(() => useApi());

    const answer = await result.current.askWeddingAI(
      1,
      "What time should guests arrive?"
    );

    expect(mockPost).toHaveBeenCalledWith("/api/weddings/1/ask", {
      question: "What time should guests arrive?",
    });
    expect(answer).toBe("Arrive by 3 PM.");
  });

  it("askWeddingAI returns fallback text when response has no answer", async () => {
    mockPost.mockResolvedValueOnce({ data: {} });

    const { result } = renderHook(() => useApi());

    const answer = await result.current.askWeddingAI(1, "Anything");

    expect(answer).toBe("The AI did not return an answer.");
  });

  it("askWeddingAI throws with message on API error", async () => {
    mockPost.mockRejectedValueOnce(
      Object.assign(new Error("Bad gateway"), {
        isAxiosError: true,
        response: { status: 502, data: { error: "AI service unavailable" } },
      })
    );

    const { result } = renderHook(() => useApi());

    await expect(result.current.askWeddingAI(1, "Hi")).rejects.toThrow(
      "AI service unavailable"
    );
  });

  it("getPrimaryWeddingId fetches /api/weddings and returns first wedding id", async () => {
    mockGet.mockResolvedValueOnce({ data: [{ id: 2 }, { id: 3 }] });

    const { result } = renderHook(() => useApi());

    const id = await result.current.getPrimaryWeddingId();

    expect(mockGet).toHaveBeenCalledWith("/api/weddings");
    expect(id).toBe(2);
  });

  it("getPrimaryWeddingId throws when weddings request fails", async () => {
    mockGet.mockRejectedValueOnce(
      Object.assign(new Error("Network error"), {
        isAxiosError: true,
        code: "ERR_NETWORK",
      })
    );

    const { result } = renderHook(() => useApi());

    await expect(result.current.getPrimaryWeddingId()).rejects.toThrow(
      /Network error|Unable to resolve/
    );
  });
});
