import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import TaskCard from "../../components/TaskCard";

describe("TaskCard Component", () => {
  const mockTask = {
    id: "1",
    title: "Test Task",
    description: "This is a test task",
    priority: "High",
    category: "Bug",
    attachments: [
      {
        name: "test.png",
        type: "image/png",
        url: "data:image/png;base64,test"
      }
    ]
  };

  const mockOnEdit = vi.fn();
  const mockOnDelete = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders task card with title", () => {
    render(<TaskCard task={mockTask} onEdit={mockOnEdit} onDelete={mockOnDelete} />);
    expect(screen.getByText("Test Task")).toBeInTheDocument();
  });

  it("renders task description", () => {
    render(<TaskCard task={mockTask} onEdit={mockOnEdit} onDelete={mockOnDelete} />);
    expect(screen.getByText("This is a test task")).toBeInTheDocument();
  });

  it('displays priority badge with correct class',() => {
    render(<TaskCard task={mockTask} onEdit={mockOnEdit} onDelete={mockOnDelete} />);
    const priorityBadge = screen.getByText("High");
    expect(priorityBadge).toHaveClass("badge", "priority-badge", "High");
  });

  it("displays category badge", () => {
    render(<TaskCard task={mockTask} onEdit={mockOnEdit} onDelete={mockOnDelete} />);
    const categoryBadge = screen.getByText("Bug");
    expect(categoryBadge).toHaveClass("badge", "category-badge", "Bug");
  });

  it("renders attachments", () => {
    render(<TaskCard task={mockTask} onEdit={mockOnEdit} onDelete={mockOnDelete} />);
    const attachment = screen.getByAltText("test.png");
    expect(attachment).toBeInTheDocument();
    expect(attachment).toHaveClass("attachment-preview");
  });

  it("calls onEdit when edit button is clicked", () => {
    render(<TaskCard task={mockTask} onEdit={mockOnEdit} onDelete={mockOnDelete} />);
    const editButton = screen.getByTitle("Edit task");
    fireEvent.click(editButton);
    expect(mockOnEdit).toHaveBeenCalledWith(mockTask);
  });

  it("calls onDelete with task object when delete button is clicked", () => {
    render(<TaskCard task={mockTask} onEdit={mockOnEdit} onDelete={mockOnDelete} />);
    const deleteButton = screen.getByTitle("Delete task");
    fireEvent.click(deleteButton);
    
    // TaskCard now passes the entire task object to onDelete
    // The confirmation modal is handled at the KanbanBoard level
    expect(mockOnDelete).toHaveBeenCalledWith(mockTask);
  });

  it("renders without description", () => {
    const taskWithoutDesc = { ...mockTask, description: "" };
    render(<TaskCard task={taskWithoutDesc} onEdit={mockOnEdit} onDelete={mockOnDelete} />);
    expect(screen.queryByText("This is a test task")).not.toBeInTheDocument();
  });

  it("renders without attachments", () => {
    const taskWithoutAttachments = { ...mockTask, attachments: [] };
    const { container } = render(
      <TaskCard task={taskWithoutAttachments} onEdit={mockOnEdit} onDelete={mockOnDelete} />
    );
    expect(container.querySelector(".task-attachments")).not.toBeInTheDocument();
  });
});
