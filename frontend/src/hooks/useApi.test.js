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

  it("askWeddingAI retries with primary wedding id on 404", async () => {
    mockPost
      .mockRejectedValueOnce(
        Object.assign(new Error("Not found"), {
          isAxiosError: true,
          response: { status: 404, data: { error: "Not found" } },
        })
      )
      .mockResolvedValueOnce({ data: { answer: "Fallback answer." } });
    mockGet.mockResolvedValueOnce({ data: [{ id: 5 }] });

    const { result } = renderHook(() => useApi());

    const answer = await result.current.askWeddingAI(999, "Hi");
    expect(answer).toBe("Fallback answer.");
    expect(mockGet).toHaveBeenCalledWith("/api/weddings");
  });

  it("getGuests fetches /api/guests", async () => {
    mockGet.mockResolvedValueOnce({
      data: [{ id: 1, name: "Alice" }],
    });

    const { result } = renderHook(() => useApi());
    const guests = await result.current.getGuests();

    expect(mockGet).toHaveBeenCalledWith("/api/guests");
    expect(guests).toEqual([{ id: 1, name: "Alice" }]);
  });

  it("getGuests throws on error", async () => {
    mockGet.mockRejectedValueOnce(
      Object.assign(new Error("Fail"), {
        isAxiosError: true,
        response: { status: 500, data: { error: "Server error" } },
      })
    );

    const { result } = renderHook(() => useApi());
    await expect(result.current.getGuests()).rejects.toThrow("Server error");
  });

  it("addGuest posts to /api/guests", async () => {
    const guest = { name: "Bob", email: "bob@test.com" };
    mockPost.mockResolvedValueOnce({ data: { id: 2, ...guest } });

    const { result } = renderHook(() => useApi());
    const created = await result.current.addGuest(guest);

    expect(mockPost).toHaveBeenCalledWith("/api/guests", { guest });
    expect(created.name).toBe("Bob");
  });

  it("getTasks fetches /api/tasks", async () => {
    mockGet.mockResolvedValueOnce({
      data: [{ id: 1, title: "Book venue" }],
    });

    const { result } = renderHook(() => useApi());
    const tasks = await result.current.getTasks();

    expect(mockGet).toHaveBeenCalledWith("/api/tasks");
    expect(tasks).toEqual([{ id: 1, title: "Book venue" }]);
  });

  it("addTask posts to /api/tasks", async () => {
    const task = { title: "Book caterer" };
    mockPost.mockResolvedValueOnce({ data: { id: 3, ...task } });

    const { result } = renderHook(() => useApi());
    const created = await result.current.addTask(task);

    expect(mockPost).toHaveBeenCalledWith("/api/tasks", { task });
    expect(created.title).toBe("Book caterer");
  });

  it("updateTask patches /api/tasks/:id", async () => {
    mockPatch.mockResolvedValueOnce({
      data: { id: 1, status: "done" },
    });

    const { result } = renderHook(() => useApi());
    const updated = await result.current.updateTask(1, { status: "done" });

    expect(mockPatch).toHaveBeenCalledWith("/api/tasks/1", {
      task: { status: "done" },
    });
    expect(updated.status).toBe("done");
  });

  it("getGuestbookEntries fetches scoped entries", async () => {
    mockGet.mockResolvedValueOnce({
      data: [{ id: 1, guest_name: "Alice", message: "Hi" }],
    });

    const { result } = renderHook(() => useApi());
    const entries = await result.current.getGuestbookEntries(1);

    expect(mockGet).toHaveBeenCalledWith(
      "/api/weddings/1/guestbook_entries"
    );
    expect(entries[0].guest_name).toBe("Alice");
  });

  it("getGuestbookEntries falls back on 404", async () => {
    mockGet
      .mockRejectedValueOnce(
        Object.assign(new Error("Not found"), {
          isAxiosError: true,
          response: { status: 404, data: {} },
        })
      )
      .mockResolvedValueOnce({
        data: [{ id: 2, guest_name: "Bob" }],
      });

    const { result } = renderHook(() => useApi());
    const entries = await result.current.getGuestbookEntries(1);

    expect(mockGet).toHaveBeenCalledWith("/api/guestbook_entries");
    expect(entries[0].guest_name).toBe("Bob");
  });

  it("addGuestbookEntry posts to /api/guestbook_entries", async () => {
    const entry = { guest_name: "Carol", message: "Congrats!" };
    mockPost.mockResolvedValueOnce({
      data: { id: 3, ...entry },
    });

    const { result } = renderHook(() => useApi());
    const created = await result.current.addGuestbookEntry(entry);

    expect(mockPost).toHaveBeenCalledWith("/api/guestbook_entries", {
      guestbook_entry: entry,
    });
    expect(created.guest_name).toBe("Carol");
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

  it("getWeddings fetches /api/weddings", async () => {
    mockGet.mockResolvedValueOnce({
      data: [{ id: 1, name: "Wedding A" }],
    });

    const { result } = renderHook(() => useApi());
    const weddings = await result.current.getWeddings();

    expect(mockGet).toHaveBeenCalledWith("/api/weddings");
    expect(weddings[0].name).toBe("Wedding A");
  });
});
