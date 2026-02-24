import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { StatCard } from "./StatCard";

describe("StatCard", () => {
  it("renders label and value", () => {
    render(<StatCard label="Total guests" value={42} />);
    expect(screen.getByText("Total guests")).toBeInTheDocument();
    expect(screen.getByText("42")).toBeInTheDocument();
  });

  it("renders hint when provided", () => {
    render(<StatCard label="Tasks" value={3} hint="2 open" />);
    expect(screen.getByText("2 open")).toBeInTheDocument();
  });

  it("does not render hint when omitted", () => {
    render(<StatCard label="Tasks" value={0} />);
    expect(screen.queryByText("hint")).not.toBeInTheDocument();
  });
});
