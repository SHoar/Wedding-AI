import { useMemo } from "react";
import axios from "axios";
import { http, normalizeWeddingId, errorMessageFrom } from "../api/client";

export function useApi() {
  return useMemo(() => {
    const fetchPrimaryWeddingId = async () => {
      const res = await http.get("/api/weddings");
      const weddings = Array.isArray(res.data) ? res.data : [];
      const firstWeddingId = weddings[0]?.id;
      return normalizeWeddingId(firstWeddingId);
    };

    const askWeddingById = async (weddingId, question) => {
      const res = await http.post(`/api/weddings/${weddingId}/ask`, {
        question,
      });
      return res.data?.answer || "The AI did not return an answer.";
    };

    return {
      getWeddings: async () => {
        try {
          const res = await http.get("/api/weddings");
          return res.data;
        } catch (error) {
          throw new Error(errorMessageFrom(error, "Unable to load weddings"));
        }
      },

      getGuests: async () => {
        try {
          const res = await http.get("/api/guests");
          return res.data;
        } catch (error) {
          throw new Error(errorMessageFrom(error, "Unable to load guests"));
        }
      },

      addGuest: async (guest) => {
        try {
          const res = await http.post("/api/guests", { guest });
          return res.data;
        } catch (error) {
          throw new Error(errorMessageFrom(error, "Unable to add guest"));
        }
      },

      getTasks: async () => {
        try {
          const res = await http.get("/api/tasks");
          return res.data;
        } catch (error) {
          throw new Error(errorMessageFrom(error, "Unable to load tasks"));
        }
      },

      addTask: async (task) => {
        try {
          const res = await http.post("/api/tasks", { task });
          return res.data;
        } catch (error) {
          throw new Error(errorMessageFrom(error, "Unable to add task"));
        }
      },

      updateTask: async (taskId, taskUpdates) => {
        try {
          const res = await http.patch(`/api/tasks/${taskId}`, {
            task: taskUpdates,
          });
          return res.data;
        } catch (error) {
          throw new Error(errorMessageFrom(error, "Unable to update task"));
        }
      },

      getGuestbookEntries: async (weddingId) => {
        const targetWeddingId = normalizeWeddingId(weddingId);

        try {
          const res = await http.get(
            `/api/weddings/${targetWeddingId}/guestbook_entries`
          );
          return res.data;
        } catch (error) {
          if (axios.isAxiosError(error) && error.response?.status === 404) {
            try {
              const fallback = await http.get("/api/guestbook_entries");
              return fallback.data;
            } catch (fallbackError) {
              throw new Error(
                errorMessageFrom(
                  fallbackError,
                  "Unable to load guestbook entries"
                )
              );
            }
          }

          throw new Error(
            errorMessageFrom(error, "Unable to load guestbook entries")
          );
        }
      },

      addGuestbookEntry: async (entry) => {
        try {
          const res = await http.post("/api/guestbook_entries", {
            guestbook_entry: entry,
          });
          return res.data;
        } catch (error) {
          throw new Error(
            errorMessageFrom(error, "Unable to add guestbook entry")
          );
        }
      },

      askWeddingAI: async (weddingId, question) => {
        const targetWeddingId = normalizeWeddingId(weddingId);

        try {
          return await askWeddingById(targetWeddingId, question);
        } catch (error) {
          if (axios.isAxiosError(error) && error.response?.status === 404) {
            try {
              const fallbackWeddingId = await fetchPrimaryWeddingId();
              if (fallbackWeddingId !== targetWeddingId) {
                return await askWeddingById(fallbackWeddingId, question);
              }
            } catch (fallbackError) {
              throw new Error(
                errorMessageFrom(fallbackError, "Unable to reach Wedding AI")
              );
            }
          }

          throw new Error(
            errorMessageFrom(error, "Unable to reach Wedding AI")
          );
        }
      },

      /**
       * Stream answer chunks via SSE. Calls onChunk(content) for each delta.
       * Returns the full answer when stream ends. Throws on error.
       * Pass an AbortSignal via options.signal to support cancellation.
       */
      askWeddingAIStream: async (
        weddingId,
        question,
        onChunk,
        { signal } = {}
      ) => {
        const trimmed = (question || "").slice(0, 4000);
        const base = import.meta.env.VITE_API_BASE_URL || "";
        const url = `${base}/api/weddings/${weddingId}/ask/stream?question=${encodeURIComponent(trimmed)}`;
        const res = await fetch(url, { credentials: "include", signal });
        if (!res.ok) {
          const text = await res.text();
          let msg = `Request failed: ${res.status}`;
          try {
            const data = JSON.parse(text);
            if (data.error) msg = data.error;
          } catch (_) {
            if (text) msg = text;
          }
          throw new Error(msg);
        }
        if (!res.body) {
          throw new Error("Response body is not available for streaming.");
        }
        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let full = "";
        let buffer = "";
        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split("\n");
            buffer = lines.pop() || "";
            for (const line of lines) {
              if (line.startsWith("data: ")) {
                try {
                  const data = JSON.parse(line.slice(6));
                  if (data.type === "delta" && data.content) {
                    full += data.content;
                    if (onChunk) onChunk(data.content);
                  }
                  if (data.type === "error") {
                    throw new Error(data.content || "Stream error");
                  }
                } catch (e) {
                  if (e instanceof SyntaxError) continue;
                  throw e;
                }
              }
            }
          }
        } finally {
          reader.releaseLock();
        }
        return full || "The AI did not return an answer.";
      },

      getPrimaryWeddingId: async () => {
        try {
          return await fetchPrimaryWeddingId();
        } catch (error) {
          throw new Error(
            errorMessageFrom(error, "Unable to resolve a wedding id")
          );
        }
      },
    };
  }, []);
}
