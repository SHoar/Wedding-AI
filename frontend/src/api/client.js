import axios from "axios";
import { JWT_STORAGE_KEY } from "../constants/storage";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "/";
const DEFAULT_WEDDING_ID = Number(import.meta.env.VITE_DEFAULT_WEDDING_ID || 1);

export const http = axios.create({
  baseURL: API_BASE,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

http.interceptors.request.use((config) => {
  const token = localStorage.getItem(JWT_STORAGE_KEY);
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export function normalizeWeddingId(value) {
  const parsed = Number(value);
  const isValid = Number.isInteger(parsed) && parsed > 0;
  return isValid ? parsed : DEFAULT_WEDDING_ID;
}

function normalizeMessage(value) {
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
}

export function errorMessageFrom(error, fallback) {
  if (!axios.isAxiosError(error)) {
    return fallback;
  }

  const responseError = normalizeMessage(error.response?.data?.error);
  const responseErrors = normalizeMessage(error.response?.data?.errors);
  const responseDetail = normalizeMessage(error.response?.data?.detail);
  const message = normalizeMessage(error.message);

  if (error.code === "ERR_NETWORK") {
    const apiDisplay =
      API_BASE === "/"
        ? typeof window !== "undefined"
          ? window.location.origin
          : "current origin"
        : API_BASE;
    return `Network error: unable to reach the API at ${apiDisplay}. Confirm the backend is running and API proxy/CORS are configured.`;
  }

  return (
    responseError || responseErrors || responseDetail || message || fallback
  );
}
