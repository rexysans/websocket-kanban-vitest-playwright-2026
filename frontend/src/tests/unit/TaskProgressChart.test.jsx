import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import TaskProgressChart from "../../components/TaskProgressChart";

describe("TaskProgressChart Component", () => {
  it("renders chart header", () => {
    render(<TaskProgressChart tasks={[]} />);
    expect(screen.getByText(/Task Progress Overview/i)).toBeInTheDocument();
  });

  it("displays correct total task count", () => {
    const tasks = [
      { id: "1", status: "todo", title: "Task 1" },
      { id: "2", status: "inProgress", title: "Task 2" },
      { id: "3", status: "done", title: "Task 3" }
    ];
    
    render(<TaskProgressChart tasks={tasks} />);
    expect(screen.getByText(/3 total tasks/i)).toBeInTheDocument();
  });

  it("calculates completion percentage correctly", () => {
    const tasks = [
      { id: "1", status: "todo", title: "Task 1" },
      { id: "2", status: "inProgress", title: "Task 2" },
      { id: "3", status: "done", title: "Task 3" },
      { id: "4", status: "done", title: "Task 4" }
    ];
    
    render(<TaskProgressChart tasks={tasks} />);
    // 2 done out of 4 total = 50%
    expect(screen.getByText(/50% completed/i)).toBeInTheDocument();
  });

  it("shows 0% completion when no tasks are done", () => {
    const tasks = [
      { id: "1", status: "todo", title: "Task 1" },
      { id: "2", status: "inProgress", title: "Task 2" }
    ];
    
    render(<TaskProgressChart tasks={tasks} />);
    expect(screen.getByText(/0% completed/i)).toBeInTheDocument();
  });

  it("shows 100% completion when all tasks are done", () => {
    const tasks = [
      { id: "1", status: "done", title: "Task 1" },
      { id: "2", status: "done", title: "Task 2" }
    ];
    
    render(<TaskProgressChart tasks={tasks} />);
    expect(screen.getByText(/100% completed/i)).toBeInTheDocument();
  });

  it("renders chart sections", () => {
    const tasks = [
      { id: "1", status: "todo", title: "Task 1" }
    ];
    
    render(<TaskProgressChart tasks={tasks} />);
    expect(screen.getByText("Task Distribution")).toBeInTheDocument();
    expect(screen.getByText("Completion Status")).toBeInTheDocument();
  });

  it("handles empty task list", () => {
    render(<TaskProgressChart tasks={[]} />);
    expect(screen.getByText(/0 total tasks/i)).toBeInTheDocument();
    expect(screen.getByText(/0% completed/i)).toBeInTheDocument();
  });
});
