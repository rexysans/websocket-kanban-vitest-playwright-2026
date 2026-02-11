import { render, screen, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import KanbanBoard from "../../components/KanbanBoard";

// Mock socket.io-client
const mockSocket = {
  on: vi.fn(),
  emit: vi.fn(),
  close: vi.fn()
};

vi.mock("socket.io-client", () => ({
  io: vi.fn(() => mockSocket)
}));

describe("KanbanBoard Component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders loading state initially", () => {
    render(<KanbanBoard />);
    expect(screen.getByText(/Connecting to server/i)).toBeInTheDocument();
  });

  it("registers socket event listeners on mount", () => {
    render(<KanbanBoard />);
    
    expect(mockSocket.on).toHaveBeenCalledWith("connect", expect.any(Function));
    expect(mockSocket.on).toHaveBeenCalledWith("tasks:synced", expect.any(Function));
    expect(mockSocket.on).toHaveBeenCalledWith("error", expect.any(Function));
    expect(mockSocket.on).toHaveBeenCalledWith("disconnect", expect.any(Function));
    expect(mockSocket.on).toHaveBeenCalledWith("connect_error", expect.any(Function));
  });

  it("emits sync:tasks event on connection", () => {
    render(<KanbanBoard />);
    
    // Simulate connection
    const connectHandler = mockSocket.on.mock.calls.find(call => call[0] === "connect")[1];
    connectHandler();
    
    expect(mockSocket.emit).toHaveBeenCalledWith("sync:tasks");
  });

  it("displays tasks synced from server", async () => {
    render(<KanbanBoard />);
    
    // Simulate connection
    const connectHandler = mockSocket.on.mock.calls.find(call => call[0] === "connect")[1];
    connectHandler();
    
    // Simulate tasks sync
    const syncHandler = mockSocket.on.mock.calls.find(call => call[0] === "tasks:synced")[1];
    const mockTasks = [
      { id: "1", title: "Test Task", status: "todo", priority: "Medium", category: "Feature", description: "", attachments: [] }
    ];
    syncHandler(mockTasks);
    
    await waitFor(() => {
      expect(screen.getByText("Test Task")).toBeInTheDocument();
    });
  });

  it("displays error message on connection error", async () => {
    render(<KanbanBoard />);
    
    // Simulate connection error
    const errorHandler = mockSocket.on.mock.calls.find(call => call[0] === "connect_error")[1];
    errorHandler(new Error("Connection failed"));
    
    await waitFor(() => {
      expect(screen.getByText(/Failed to connect to server/i)).toBeInTheDocument();
    });
  });

  it("renders three columns", async () => {
    render(<KanbanBoard />);
    
    // Simulate connection
    const connectHandler = mockSocket.on.mock.calls.find(call => call[0] === "connect")[1];
    connectHandler();
    
    // Simulate empty tasks sync
    const syncHandler = mockSocket.on.mock.calls.find(call => call[0] === "tasks:synced")[1];
    syncHandler([]);
    
    await waitFor(() => {
      expect(screen.getByText("To Do")).toBeInTheDocument();
      expect(screen.getByText("In Progress")).toBeInTheDocument();
      expect(screen.getByText("Done")).toBeInTheDocument();
    });
  });

  it("shows empty state when no tasks in column", async () => {
    render(<KanbanBoard />);
    
    const connectHandler = mockSocket.on.mock.calls.find(call => call[0] === "connect")[1];
    connectHandler();
    
    const syncHandler = mockSocket.on.mock.calls.find(call => call[0] === "tasks:synced")[1];
    syncHandler([]);
    
    await waitFor(() => {
      expect(screen.getAllByText(/No tasks yet/i).length).toBeGreaterThan(0);
    });
  });

  it("closes socket connection on unmount", () => {
    const { unmount } = render(<KanbanBoard />);
    unmount();
    
    expect(mockSocket.close).toHaveBeenCalled();
  });
});
