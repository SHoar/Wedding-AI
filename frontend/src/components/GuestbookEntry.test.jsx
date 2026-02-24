import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { GuestbookEntry } from "./GuestbookEntry";

describe("GuestbookEntry", () => {
  it("renders guest name and message", () => {
    render(
      <GuestbookEntry
        entry={{
          guest_name: "Alice",
          message: "Congratulations! So happy for you both.",
          is_public: true,
        }}
      />
    );
    expect(screen.getByText("Alice")).toBeInTheDocument();
    expect(
      screen.getByText("Congratulations! So happy for you both.")
    ).toBeInTheDocument();
    expect(screen.getByText("Public")).toBeInTheDocument();
  });

  it("falls back to name when guest_name is missing", () => {
    render(<GuestbookEntry entry={{ name: "Bob", message: "Hi" }} />);
    expect(screen.getByText("Bob")).toBeInTheDocument();
  });

  it("shows Private when is_public is false", () => {
    render(
      <GuestbookEntry
        entry={{
          guest_name: "Carol",
          message: "Private note",
          is_public: false,
        }}
      />
    );
    expect(screen.getByText("Private")).toBeInTheDocument();
  });
});
