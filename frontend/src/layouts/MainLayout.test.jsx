import { render, screen } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { describe, it, expect } from "vitest";
import { MainLayout } from "./MainLayout";

function renderWithRouter(initialEntry = "/") {
  return render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <Routes>
        <Route element={<MainLayout />} path="/">
          <Route
            element={<div data-testid="outlet-content">Page content</div>}
            index
          />
        </Route>
      </Routes>
    </MemoryRouter>
  );
}

describe("MainLayout", () => {
  it("renders nav links for Dashboard, Guests, Guestbook, Tasks, Wedding AI", () => {
    renderWithRouter();
    expect(
      screen.getByRole("link", { name: /Dashboard/i })
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Guests/i })).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /Guestbook/i })
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Tasks/i })).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /Wedding AI/i })
    ).toBeInTheDocument();
  });

  it("renders outlet content", () => {
    renderWithRouter();
    expect(screen.getByTestId("outlet-content")).toHaveTextContent(
      "Page content"
    );
  });

  it("renders Wedding Coordination heading", () => {
    renderWithRouter();
    expect(screen.getByText(/Wedding Coordination/)).toBeInTheDocument();
  });
});
