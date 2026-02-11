import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach } from "vitest";
import KanbanBoard from "../../components/KanbanBoard";

describe("WebSocket Integration Tests", () => {
  let mockSocket;
  
  beforeEach(() => {
    mockSocket = {
      on: vi.fn(),
      emit: vi.fn(),
      close: vi.fn()
    };
  });

  it("creates a new task via WebSocket", async () => {
    const user = userEvent.setup();
    render(<KanbanBoard socket={mockSocket} tasks={[]} loading={false} error={null} />);
    
    // Click add task button
    const addButtons = screen.getAllByText("+ Add Task");
    await user.click(addButtons[0]); // Click "To Do" add button
    
    // Fill form
    await waitFor(() => {
      expect(screen.getByText("Create New Task")).toBeInTheDocument();
    });
    
    const titleInput = screen.getByPlaceholderText("Enter task title");
    await user.type(titleInput, "New Integration Task");
    
    const submitButton = screen.getByRole("button", { name: /create task/i });
    await user.click(submitButton);
    
    // Verify socket emit was called
    expect(mockSocket.emit).toHaveBeenCalledWith(
      "task:create",
      expect.objectContaining({
        title: "New Integration Task",
        status: "todo"
      })
    );
  });

  it("updates tasks when server sends sync event", async () => {
    const initialTasks = [
      { id: "1", title: "Task 1", status: "todo", priority: "High", category: "Bug", attachments: [] }
    ];

    const { rerender } = render(
      <KanbanBoard socket={mockSocket} tasks={initialTasks} loading={false} error={null} />
    );
    
    expect(screen.getByText("Task 1")).toBeInTheDocument();

    // Simulate server sending updated tasks
    const updatedTasks = [
      { id: "1", title: "Task 1", status: "todo", priority: "High", category: "Bug", attachments: [] },
      { id: "2", title: "Task 2", status: "inProgress", priority: "Medium", category: "Feature", attachments: [] }
    ];

    rerender(<KanbanBoard socket={mockSocket} tasks={updatedTasks} loading={false} error={null} />);
    
    await waitFor(() => {
      expect(screen.getByText("Task 2")).toBeInTheDocument();
    });
  });

  it("emits delete event when task is deleted", async () => {
    const user = userEvent.setup();
    const tasks = [
      { id: "1", title: "Task to Delete", status: "todo", priority: "High", category: "Bug", attachments: [] }
    ];

    render(<KanbanBoard socket={mockSocket} tasks={tasks} loading={false} error={null} />);
    
    const deleteButton = screen.getByTitle("Delete task");
    await user.click(deleteButton);
    
    // Wait for confirmation modal
    await waitFor(() => {
      expect(screen.getByText(/Delete Task/i)).toBeInTheDocument();
    });

    //Click confirm delete (the button with exact text "Delete")
    const confirmButton = screen.getByRole("button", { name: "Delete" });
    await user.click(confirmButton);

    // Verify socket emit was called
    expect(mockSocket.emit).toHaveBeenCalledWith("task:delete", "1");
  });

  it("handles server errors gracefully", () => {
    render(<KanbanBoard socket={mockSocket} tasks={[]} loading={false} error="Connection failed" />);
    
    expect(screen.getByText(/Connection failed/i)).toBeInTheDocument();
  });

  it("displays correct task counts in columns", () => {
    const tasks = [
      { id: "1", title: "Task 1", status: "todo", priority: "High", category: "Bug", attachments: [] },
      { id: "2", title: "Task 2", status: "todo", priority: "Medium", category: "Feature", attachments: [] },
      { id: "3", title: "Task 3", status: "inProgress", priority: "Low", category: "Enhancement", attachments: [] },
      { id: "4", title: "Task 4", status: "done", priority: "High", category: "Bug", attachments: [] }
    ];

    render(<KanbanBoard socket={mockSocket} tasks={tasks} loading={false} error={null} />);
    
    const todoColumn = screen.getByText("To Do").closest('.kanban-column');
    const inProgressColumn = screen.getByText("In Progress").closest('.kanban-column');
    const doneColumn = screen.getByText("Done").closest('.kanban-column');

    expect(todoColumn).toHaveTextContent("2");
    expect(inProgressColumn).toHaveTextContent("1");
    expect(doneColumn).toHaveTextContent("1");
  });

  it("filters tasks by status into correct columns", () => {
    const tasks = [
      { id: "1", title: "Todo Task", status: "todo", priority: "High", category: "Bug", attachments: [] },
{ id: "2", title: "In Progress Task", status: "inProgress", priority: "Medium", category: "Feature", attachments: [] },
      { id: "3", title: "Done Task", status: "done", priority: "Low", category: "Enhancement", attachments: [] }
    ];

    render(<KanbanBoard socket={mockSocket} tasks={tasks} loading={false} error={null} />);
    
    expect(screen.getByText("Todo Task")).toBeInTheDocument();
    expect(screen.getByText("In Progress Task")).toBeInTheDocument();
    expect(screen.getByText("Done Task")).toBeInTheDocument();
  });

  it("emits update event when task is edited", async () => {
    const user = userEvent.setup();
    const tasks = [
      { id: "1", title: "Original Title", description: "Original description", status: "todo", priority: "High", category: "Bug", attachments: [] }
    ];

    render(<KanbanBoard socket={mockSocket} tasks={tasks} loading={false} error={null} />);
    
    const editButton = screen.getByTitle("Edit task");
    await user.click(editButton);
    
    // Wait for edit modal
    await waitFor(() => {
      expect(screen.getByText("Edit Task")).toBeInTheDocument();
    });

    const titleInput = screen.getByDisplayValue("Original Title");
    await user.clear(titleInput);
    await user.type(titleInput, "Updated Title");

    const saveButton = screen.getByRole("button", { name: /update task/i });
    await user.click(saveButton);

    // Verify socket emit was called
    expect(mockSocket.emit).toHaveBeenCalledWith(
      "task:update",
      expect.objectContaining({
        id: "1",
        title: "Updated Title"
      })
    );
  });
});
