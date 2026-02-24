import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, it, expect } from "vitest";
import { NotFoundPage } from "./NotFoundPage";

describe("NotFoundPage", () => {
  it("renders page not found message", () => {
    render(
      <MemoryRouter>
        <NotFoundPage />
      </MemoryRouter>
    );
    expect(
      screen.getByRole("heading", { name: /Page not found/i })
    ).toBeInTheDocument();
    expect(screen.getByText(/does not exist/)).toBeInTheDocument();
  });

  it("renders link back to dashboard", () => {
    render(
      <MemoryRouter>
        <NotFoundPage />
      </MemoryRouter>
    );
    const link = screen.getByRole("link", { name: /Back to dashboard/i });
    expect(link).toHaveAttribute("href", "/");
  });
});
