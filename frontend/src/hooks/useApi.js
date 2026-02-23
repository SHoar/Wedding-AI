import { useMemo } from "react";
import axios from "axios";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";
const DEFAULT_WEDDING_ID = Number(import.meta.env.VITE_DEFAULT_WEDDING_ID || 1);

const isValidWeddingId = (value) => {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0;
};

const normalizeWeddingId = (value) => (isValidWeddingId(value) ? Number(value) : DEFAULT_WEDDING_ID);

const http = axios.create({
  baseURL: API_BASE,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

http.interceptors.request.use((config) => {
  const token = localStorage.getItem("wedding_jwt");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

const normalizeMessage = (value) => {
  if (!value && value !== 0) return "";
  if (typeof value === "string") return value;
  if (Array.isArray(value)) return value.filter(Boolean).join(", ");
  if (typeof value === "object") {
    const flattenedValues = Object.values(value).flat();
    if (flattenedValues.length) {
      return flattenedValues.filter(Boolean).join(", ");
    }
    return JSON.stringify(value);
  }
  return String(value);
};

const errorMessageFrom = (error, fallback) => {
  if (!axios.isAxiosError(error)) {
    return fallback;
  }

  const responseError = normalizeMessage(error.response?.data?.error);
  const responseErrors = normalizeMessage(error.response?.data?.errors);
  const responseDetail = normalizeMessage(error.response?.data?.detail);
  const message = normalizeMessage(error.message);

  if (error.code === "ERR_NETWORK") {
    return `Network error: unable to reach the API at ${API_BASE}. Confirm the backend is running and CORS allows this frontend origin.`;
  }

  return responseError || responseErrors || responseDetail || message || fallback;
};

export function useApi() {
  return useMemo(
    () => {
      const fetchPrimaryWeddingId = async () => {
        const res = await http.get("/api/weddings");
        const weddings = Array.isArray(res.data) ? res.data : [];
        const firstWeddingId = weddings[0]?.id;
        return normalizeWeddingId(firstWeddingId);
      };

      const askWeddingById = async (weddingId, question) => {
        const res = await http.post(`/api/weddings/${weddingId}/ask`, { question });
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
            const res = await http.patch(`/api/tasks/${taskId}`, { task: taskUpdates });
            return res.data;
          } catch (error) {
            throw new Error(errorMessageFrom(error, "Unable to update task"));
          }
        },

        getGuestbookEntries: async (weddingId) => {
          const targetWeddingId = normalizeWeddingId(weddingId);

          try {
            const res = await http.get(`/api/weddings/${targetWeddingId}/guestbook_entries`);
            return res.data;
          } catch (error) {
            if (axios.isAxiosError(error) && error.response?.status === 404) {
              try {
                const fallback = await http.get("/api/guestbook_entries");
                return fallback.data;
              } catch (fallbackError) {
                throw new Error(
                  errorMessageFrom(fallbackError, "Unable to load guestbook entries"),
                );
              }
            }

            throw new Error(errorMessageFrom(error, "Unable to load guestbook entries"));
          }
        },

        addGuestbookEntry: async (entry) => {
          try {
            const res = await http.post("/api/guestbook_entries", {
              guestbook_entry: entry,
            });
            return res.data;
          } catch (error) {
            throw new Error(errorMessageFrom(error, "Unable to add guestbook entry"));
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
                throw new Error(errorMessageFrom(fallbackError, "Unable to reach Wedding AI"));
              }
            }

            throw new Error(errorMessageFrom(error, "Unable to reach Wedding AI"));
          }
        },

        getPrimaryWeddingId: async () => {
          try {
            return await fetchPrimaryWeddingId();
          } catch (error) {
            throw new Error(errorMessageFrom(error, "Unable to resolve a wedding id"));
          }
        },
      };
    },
    [],
  );
}
