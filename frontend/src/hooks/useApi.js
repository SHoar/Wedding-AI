import { useMemo } from "react";
import axios from "axios";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";

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
  const message = normalizeMessage(error.message);

  return responseError || responseErrors || message || fallback;
};

export function useApi() {
  return useMemo(
    () => ({
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
        try {
          const res = await http.get(`/api/weddings/${weddingId}/guestbook_entries`);
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
        try {
          const res = await http.post(`/api/weddings/${weddingId}/ask`, { question });
          return res.data?.answer || "The AI did not return an answer.";
        } catch (error) {
          throw new Error(errorMessageFrom(error, "Unable to reach Wedding AI"));
        }
      },
    }),
    [],
  );
}
