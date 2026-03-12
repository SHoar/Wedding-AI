import { describe, it, expect, vi } from "vitest";

vi.mock("axios", () => ({
  default: {
    create: vi.fn(() => ({
      get: vi.fn(),
      post: vi.fn(),
      interceptors: { request: { use: vi.fn() } },
    })),
    isAxiosError: (e) => Boolean(e?.isAxiosError),
  },
}));

import { normalizeWeddingId, errorMessageFrom } from "./client";

describe("normalizeWeddingId", () => {
  it("returns a valid positive integer as-is", () => {
    expect(normalizeWeddingId(5)).toBe(5);
  });

  it("parses string numbers", () => {
    expect(normalizeWeddingId("3")).toBe(3);
  });

  it("returns default for zero", () => {
    const result = normalizeWeddingId(0);
    expect(result).toBeGreaterThan(0);
  });

  it("returns default for negative", () => {
    const result = normalizeWeddingId(-1);
    expect(result).toBeGreaterThan(0);
  });

  it("returns default for NaN", () => {
    const result = normalizeWeddingId("abc");
    expect(result).toBeGreaterThan(0);
  });

  it("returns default for null", () => {
    const result = normalizeWeddingId(null);
    expect(result).toBeGreaterThan(0);
  });

  it("returns default for undefined", () => {
    const result = normalizeWeddingId(undefined);
    expect(result).toBeGreaterThan(0);
  });

  it("returns default for float", () => {
    const result = normalizeWeddingId(1.5);
    expect(result).toBeGreaterThan(0);
  });
});

describe("errorMessageFrom", () => {
  it("returns fallback for non-axios errors", () => {
    const err = new Error("plain");
    expect(errorMessageFrom(err, "fallback")).toBe("fallback");
  });

  it("extracts error from response data", () => {
    const err = Object.assign(new Error("Boom"), {
      isAxiosError: true,
      response: { data: { error: "Bad request" } },
    });
    expect(errorMessageFrom(err, "fallback")).toBe("Bad request");
  });

  it("extracts errors array from response data", () => {
    const err = Object.assign(new Error("Boom"), {
      isAxiosError: true,
      response: { data: { errors: ["field invalid", "field required"] } },
    });
    expect(errorMessageFrom(err, "fallback")).toBe(
      "field invalid, field required"
    );
  });

  it("extracts detail from response data", () => {
    const err = Object.assign(new Error("Boom"), {
      isAxiosError: true,
      response: { data: { detail: "Something wrong" } },
    });
    expect(errorMessageFrom(err, "fallback")).toBe("Something wrong");
  });

  it("returns network error message for ERR_NETWORK", () => {
    const err = Object.assign(new Error("Network Error"), {
      isAxiosError: true,
      code: "ERR_NETWORK",
      response: undefined,
    });
    const msg = errorMessageFrom(err, "fallback");
    expect(msg).toContain("Network error");
    expect(msg).toContain("unable to reach the API");
  });

  it("falls back to error.message when no response data", () => {
    const err = Object.assign(new Error("timeout"), {
      isAxiosError: true,
      response: { data: {} },
    });
    expect(errorMessageFrom(err, "fallback")).toBe("timeout");
  });

  it("returns fallback when everything is empty", () => {
    const err = Object.assign(new Error(""), {
      isAxiosError: true,
      response: { data: {} },
    });
    expect(errorMessageFrom(err, "fallback")).toBe("fallback");
  });

  it("handles object-type errors in response data", () => {
    const err = Object.assign(new Error("Boom"), {
      isAxiosError: true,
      response: { data: { errors: { name: ["is blank"] } } },
    });
    expect(errorMessageFrom(err, "fallback")).toBe("is blank");
  });
});
