import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach } from "vitest";
import TaskForm from "../../components/TaskForm";

describe("TaskForm Component", () => {
  const mockOnSubmit = vi.fn();
  const mockOnCancel = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders form header for new task", () => {
    render(<TaskForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);
    expect(screen.getByText("Create New Task")).toBeInTheDocument();
  });

  it("renders form header for editing task", () => {
    const task = { id: "1", title: "Edit me", description: "", priority: "Medium", category: "Feature" };
    render(<TaskForm task={task} onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);
    expect(screen.getByText("Edit Task")).toBeInTheDocument();
  });

  it("validates required title field", async () => {
    const user = userEvent.setup();
    render(<TaskForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);
    
    const submitButton = screen.getByText("Create Task");
    await user.click(submitButton);
    
    expect(await screen.findByText("Title is required")).toBeInTheDocument();
    expect(mockOnSubmit).not.toHaveBeenCalled();
  });

  it("submits form with valid data", async () => {
    const user = userEvent.setup();
    render(<TaskForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);
    
    const titleInput = screen.getByPlaceholderText("Enter task title");
    const descInput = screen.getByPlaceholderText("Enter task description");
    
    await user.type(titleInput, "New Task");
    await user.type(descInput, "Task description");
    
    const submitButton = screen.getByText("Create Task");
    await user.click(submitButton);
    
    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith(expect.objectContaining({
        title: "New Task",
        description: "Task description",
        priority: "Medium",
        category: "Feature",
        status: "todo",
        attachments: []
      }));
    });
  });

  it("pre-fills form when editing existing task", () => {
    const task = {
      id: "1",
      title: "Existing Task",
      description: "Existing description",
      priority: "High",
      category: "Bug",
      status: "inProgress",
      attachments: []
    };
    
    render(<TaskForm task={task} onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);
    
    expect(screen.getByDisplayValue("Existing Task")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Existing description")).toBeInTheDocument();
  });

  it("calls onCancel when cancel button is clicked", async () => {
    const user = userEvent.setup();
    render(<TaskForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);
    
    const cancelButton = screen.getByText("Cancel");
    await user.click(cancelButton);
    
    expect(mockOnCancel).toHaveBeenCalled();
  });

  it("closes modal when clicking overlay", async () => {
    const user = userEvent.setup();
    render(<TaskForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);
    
    const overlay = screen.getByText("Create New Task").closest(".modal-overlay");
    await user.click(overlay);
    
    expect(mockOnCancel).toHaveBeenCalled();
  });

  it("does not close modal when clicking inside modal content", async () => {
    const user = userEvent.setup();
    render(<TaskForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);
    
    const modalContent = screen.getByText("Create New Task").closest(".modal-content");
    await user.click(modalContent);
    
    expect(mockOnCancel).not.toHaveBeenCalled();
  });

  it("shows error for invalid file type", async () => {
    render(<TaskForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);
    
    const file = new File(["content"], "test.exe", { type: "application/x-msdownload" });
    const fileInput = document.getElementById("file-input");
    
    Object.defineProperty(fileInput, "files", {
      value: [file],
      writable: false
    });
    
    fireEvent.change(fileInput);
    
    await waitFor(() => {
      expect(screen.getByText(/Invalid file type/i)).toBeInTheDocument();
    });
  });

  it("shows error for file size exceeding 5MB", async () => {
    render(<TaskForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);
    
    // Create a large file (6MB) 
    const largeFile = new File(["x".repeat(6 * 1024 * 1024)], "large.png", { type: "image/png" });
    const fileInput = document.getElementById("file-input");
    
    Object.defineProperty(fileInput, "files", {
      value: [largeFile],
      writable: false
    });
    
    fireEvent.change(fileInput);
    
    await waitFor(() => {
      expect(screen.getByText(/File too large/i)).toBeInTheDocument();
    });
  });

  it("removes error when user starts typing in title", async () => {
    const user = userEvent.setup();
    render(<TaskForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);
    
    // Trigger validation error
    const submitButton = screen.getByText("Create Task");
    await user.click(submitButton);
    expect(await screen.findByText("Title is required")).toBeInTheDocument();
    
    // Start typing
    const titleInput = screen.getByPlaceholderText("Enter task title");
    await user.type(titleInput, "T");
    
    await waitFor(() => {
      expect(screen.queryByText("Title is required")).not.toBeInTheDocument();
    });
  });
});
