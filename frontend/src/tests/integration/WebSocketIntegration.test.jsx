import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach } from "vitest";
import KanbanBoard from "../../components/KanbanBoard";

// Mock socket.io-client with more detailed implementation
const mockEmit = vi.fn();
const eventHandlers = {};

const mockSocket = {
  on: vi.fn((event, handler) => {
    eventHandlers[event] = handler;
  }),
  emit: mockEmit,
  close: vi.fn()
};

vi.mock("socket.io-client", () => ({
  io: vi.fn(() => mockSocket)
}));

describe("WebSocket Integration Tests", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    Object.keys(eventHandlers).forEach(key => delete eventHandlers[key]);
  });

  it("creates a new task via WebSocket", async () => {
    const user = userEvent.setup();
    render(<KanbanBoard />);
    
    // Connect and sync
    eventHandlers.connect();
    eventHandlers["tasks:synced"]([]);
    
    await waitFor(() => {
      expect(screen.getByText("To Do")).toBeInTheDocument();
    });
    
    // Click add task button
    const addButtons = screen.getAllByText("+ Add Task");
    await user.click(addButtons[0]); // Click "To Do" add button
    
    // Fill form
    await waitFor(() => {
      expect(screen.getByText("Create New Task")).toBeInTheDocument();
    });
    
    const titleInput = screen.getByPlaceholderText("Enter task title");
    await user.type(titleInput, "New Integration Task");
    
    const submitButton = screen.getByText("Create Task");
    await user.click(submitButton);
    
    // Verify task:create was emitted
    await waitFor(() => {
      expect(mockEmit).toHaveBeenCalledWith("task:create", expect.objectContaining({
        title: "New Integration Task",
        status: "todo"
      }));
    });
  });

  it("updates task via WebSocket", async () => {
    const user = userEvent.setup();
    render(<KanbanBoard />);
    
    eventHandlers.connect();
    
    const existingTask = {
      id: "1",
      title: "Existing Task",
      description: "Old description",
      status: "todo",
      priority: "Medium",
      category: "Feature",
      attachments: []
    };
    
    eventHandlers["tasks:synced"]([existingTask]);
    
    await waitFor(() => {
      expect(screen.getByText("Existing Task")).toBeInTheDocument();
    });
    
    // Click edit button
    const editButton = screen.getByTitle("Edit task");
    await user.click(editButton);
    
    await waitFor(() => {
      expect(screen.getByText("Edit Task")).toBeInTheDocument();
    });
    
    const titleInput = screen.getByDisplayValue("Existing Task");
    await user.clear(titleInput);
    await user.type(titleInput, "Updated Task");
    
    const submitButton = screen.getByText("Update Task");
    await user.click(submitButton);
    
    await waitFor(() => {
      expect(mockEmit).toHaveBeenCalledWith("task:update", expect.objectContaining({
        id: "1",
        title: "Updated Task"
      }));
    });
  });

  it("deletes task via WebSocket", async () => {
    const user = userEvent.setup();
    const confirmSpy = vi.spyOn(window, "confirm").mockReturnValue(true);
    
    render(<KanbanBoard />);
    
    eventHandlers.connect();
    
    const task = {
      id: "task-to-delete",
      title: "Delete Me",
      status: "todo",
      priority: "Low",
      category: "Bug",
      description: "",
      attachments: []
    };
    
    eventHandlers["tasks:synced"]([task]);
    
    await waitFor(() => {
      expect(screen.getByText("Delete Me")).toBeInTheDocument();
    });
    
    const deleteButton = screen.getByTitle("Delete task");
    await user.click(deleteButton);
    
    await waitFor(() => {
      expect(mockEmit).toHaveBeenCalledWith("task:delete", "task-to-delete");
    });
    
    confirmSpy.mockRestore();
  });

  it("receives real-time task updates", async () => {
    render(<KanbanBoard />);
    
    eventHandlers.connect();
    eventHandlers["tasks:synced"]([]);
    
    await waitFor(() => {
      expect(screen.getByText("To Do")).toBeInTheDocument();
    });
    
    // Simulate another client creating a task
    const newTask = {
      id: "new-task",
      title: "From Another Client",
      status: "inProgress",
      priority: "High",
      category: "Feature",
      description: "Real-time sync test",
      attachments: []
    };
    
    eventHandlers["tasks:synced"]([newTask]);
    
    await waitFor(() => {
      expect(screen.getByText("From Another Client")).toBeInTheDocument();
    });
  });

  it("handles server errors gracefully", async () => {
    render(<KanbanBoard />);
    
    eventHandlers.connect();
    
    // Simulate server error
    eventHandlers.error({ message: "Database connection failed" });
    
    await waitFor(() => {
      expect(screen.getByText(/Database connection failed/i)).toBeInTheDocument();
    });
  });

  it("re-syncs tasks on reconnection", () => {
    render(<KanbanBoard />);
    
    // Initial connection
    eventHandlers.connect();
    expect(mockEmit).toHaveBeenCalledWith("sync:tasks");
    
    mockEmit.mockClear();
    
    // Simulate disconnect and reconnect
    eventHandlers.disconnect();
    eventHandlers.connect();
    
    expect(mockEmit).toHaveBeenCalledWith("sync:tasks");
  });

  it("filters tasks by status into correct columns", async () => {
    render(<KanbanBoard />);
    
    eventHandlers.connect();
    
    const tasks = [
      { id: "1", title: "Todo Task", status: "todo", priority: "Low", category: "Feature", description: "", attachments: [] },
      { id: "2", title: "In Progress Task", status: "inProgress", priority: "Medium", category: "Bug", description: "", attachments: [] },
      { id: "3", title: "Done Task", status: "done", priority: "High", category: "Enhancement", description: "", attachments: [] }
    ];
    
    eventHandlers["tasks:synced"](tasks);
    
    await waitFor(() => {
      expect(screen.getByText("Todo Task")).toBeInTheDocument();
      expect(screen.getByText("In Progress Task")).toBeInTheDocument();
      expect(screen.getByText("Done Task")).toBeInTheDocument();
    });
    
    // Verify each task is in correct column by checking task count badges
    const taskCounts = screen.getAllByText("1");
    expect(taskCounts.length).toBe(3); // One task in each column
  });
});
