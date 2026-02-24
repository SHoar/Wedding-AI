import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { GuestCard } from "./GuestCard";

describe("GuestCard", () => {
  it("renders guest name and details", () => {
    render(
      <GuestCard
        guest={{
          name: "Jane Doe",
          email: "jane@example.com",
          phone: "555-1234",
          plus_one_count: 1,
          dietary_notes: "Vegetarian",
        }}
      />
    );
    expect(screen.getByText("Jane Doe")).toBeInTheDocument();
    expect(screen.getByText(/jane@example\.com/)).toBeInTheDocument();
    expect(screen.getByText(/555-1234/)).toBeInTheDocument();
    expect(screen.getByText(/Vegetarian/)).toBeInTheDocument();
    expect(screen.getByText("Plus ones:")).toBeInTheDocument();
  });

  it("renders Unnamed guest when name is missing", () => {
    render(<GuestCard guest={{ email: "a@b.com" }} />);
    expect(screen.getByText("Unnamed guest")).toBeInTheDocument();
  });

  it("renders dash for missing optional fields", () => {
    render(<GuestCard guest={{ name: "Bob" }} />);
    expect(screen.getByText("Email:")).toBeInTheDocument();
    const dashes = screen.getAllByText("-");
    expect(dashes.length).toBeGreaterThanOrEqual(1);
  });
});
