import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi } from "vitest";
import { TaskCard } from "./TaskCard";

describe("TaskCard", () => {
  it("renders task title and priority", () => {
    render(
      <TaskCard
        task={{ id: 1, title: "Book venue", status: 0, priority: 2 }}
        onStatusChange={vi.fn()}
      />
    );
    expect(screen.getByText("Book venue")).toBeInTheDocument();
    expect(screen.getByText(/High priority/)).toBeInTheDocument();
  });

  it("renders Untitled task when title is missing", () => {
    render(
      <TaskCard
        task={{ id: 1, status: 0, priority: 0 }}
        onStatusChange={vi.fn()}
      />
    );
    expect(screen.getByText("Untitled task")).toBeInTheDocument();
  });

  it("calls onStatusChange when status button is clicked", async () => {
    const user = userEvent.setup();
    const onStatusChange = vi.fn();
    render(
      <TaskCard
        task={{ id: 1, title: "Task", status: 0, priority: 0 }}
        onStatusChange={onStatusChange}
      />
    );
    await user.click(screen.getByRole("button", { name: "Done" }));
    expect(onStatusChange).toHaveBeenCalledWith(
      { id: 1, title: "Task", status: 0, priority: 0 },
      2
    );
  });
});
