# Real-time WebSocket Kanban Board - Developer Documentation

## Table of Contents
1. [Project Overview](#project-overview)
2. [Architecture Overview](#architecture-overview)
3. [Application Features](#application-features)
4. [WebSocket Event Flow](#websocket-event-flow)
5. [Testing Strategy](#testing-strategy)
6. [Flow Diagrams](#flow-diagrams)
7. [Developer Setup Guide](#developer-setup-guide)
8. [Known Design Decisions](#known-design-decisions)
9. [Extension Guide](#extension-guide)

---

## Project Overview

### What This Application Does

A **real-time collaborative Kanban board** that synchronizes task state across multiple connected clients using WebSockets. Users can create, update, delete, and drag tasks between columns while seeing changes from other users instantly.

### Core Capabilities

- **Task Management**: Full CRUD operations on tasks with title, description, priority, category, and file attachments
- **Drag-and-Drop**: Intuitive task movement between columns (To Do, In Progress, Done) with visual feedback
- **Real-time Sync**: WebSocket-powered synchronization ensuring all clients see the same state
- **Visual Progress Tracking**: Live charts showing task distribution and completion percentage
- **Custom Confirmation Modals**: Styled confirmation dialogs for destructive actions
- **Scrollable Columns**: Support for unlimited tasks per column with smooth scrolling

### Real-time Synchronization Behavior

The application maintains a **single source of truth** on the server:
- Client actions emit events to the server
- Server validates and updates state
- Server broadcasts the new state to ALL connected clients
- All clients re-render with the new data

This ensures **eventual consistency** across all sessions.

### Design Goals

1. **Predictable State Management**: Server is always the authority
2. **Optimistic UI**: Fast local feedback with server confirmation
3. **Scalable Architecture**: Support for multiple concurrent users
4. **Testable Design**: Clear separation of concerns for unit/integration testing

---

## Architecture Overview

### High-Level System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Client Browser                        │
│  ┌────────────┐  ┌──────────────┐  ┌──────────────────┐    │
│  │   App.jsx  │──│ KanbanBoard  │──│ TaskProgressChart│    │
│  │  (State)   │  │  (UI Logic)  │  │   (Visualization)│    │
│  └─────┬──────┘  └──────┬───────┘  └──────────────────┘    │
│        │                 │                                    │
│        └────WebSocket────┘                                   │
└─────────────────┬────────────────────────────────────────────┘
                  │
                  │ socket.io (WebSocket + Polling fallback)
                  │
┌─────────────────▼────────────────────────────────────────────┐
│                     Node.js Backend                          │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  server.js                                            │   │
│  │  - In-memory task array                              │   │
│  │  - Socket.IO event handlers                          │   │
│  │  - Task validation logic                             │   │
│  │  - Broadcast mechanism (io.emit)                     │   │
│  └──────────────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────────────────┘
```

### Component Hierarchy

```
App.jsx (WebSocket connection + task state)
  │
  ├─ TaskProgressChart (read-only visualization)
  │
  └─ KanbanBoard (task management)
       │
       ├─ Column (x3: todo, inProgress, done)
       │    │
       │    ├─ SortableTaskCard (drag-enabled wrapper)
       │    │    └─ TaskCard (task display + actions)
       │    │
       │    └─ Add Task Button
       │
       ├─ TaskForm (create/edit modal)
       │
       └─ ConfirmationModal (delete confirmation)
```

### Component Responsibilities

| Component | Responsibility | State Management |
|-----------|---------------|------------------|
| **App.jsx** | WebSocket lifecycle, root state holder | `tasks[]`, `socket`, `loading`, `error` |
| **KanbanBoard** | Drag-drop orchestration, task actions | Local UI state (modals, forms) |
| **Column** | Droppable container, task filtering | Stateless (props only) |
| **TaskCard** | Task display, edit/delete triggers | Stateless |
| **TaskForm** | Task creation/editing | Local form state |
| **ConfirmationModal** | Delete confirmation | Controlled via parent |
| **TaskProgressChart** | Data visualization | Stateless (computed from props) |

### State Lifecycle

```
┌──────────────────────────────────────────────────────────────┐
│                     State Flow Lifecycle                      │
└──────────────────────────────────────────────────────────────┘

1. User Action (UI interaction)
          ↓
2. Local Event Handler (KanbanBoard)
          ↓
3. WebSocket Emit (socket.emit('task:create', data))
          ↓
4. Server Receives & Validates
          ↓
5. Server Updates In-Memory State
          ↓
6. Server Broadcasts (io.emit('tasks:synced', tasks))
          ↓
7. All Clients Receive Update
          ↓
8. App.jsx Updates State (setTasks)
          ↓
9. React Re-renders Components
          ↓
10. UI Reflects New State
```

**Key Principle**: Client NEVER directly updates task state. All mutations go through the server.

---

## Application Features

### 1. Task CRUD Operations

#### Create Task
- **Trigger**: Click "+ Add Task" button in any column
- **Flow**: Opens `TaskForm` modal → User fills form → Emits `task:create` → Server assigns UUID → Broadcasts to all clients
- **Fields**: Title (required), Description, Priority (High/Medium/Low), Category (Bug/Feature/Enhancement), Attachments

#### Read Tasks
- **Trigger**: Initial connection or server broadcast
- **Flow**: Server emits `tasks:synced` with full task array → Client filters by status into columns
- **Display**: Tasks grouped by `status` field (todo/inProgress/done)

#### Update Task
- **Trigger**: Click edit button (✏️) on task card
- **Flow**: Opens `TaskForm` with pre-filled data → User modifies → Emits `task:update` with task ID
- **Validation**: Server checks task exists before updating

#### Delete Task
- **Trigger**: Click delete button (🗑️) on task card
- **Flow**: Opens `ConfirmationModal` → User confirms → Emits `task:delete` with task ID → Server removes from array
- **Safety**: Custom modal prevents accidental deletions

### 2. Drag-and-Drop System

**Library**: `@dnd-kit/core` + `@dnd-kit/sortable`

#### Architecture
- **Droppable Containers**: Each Column component wraps tasks in a droppable zone
- **Draggable Items**: SortableTaskCard wraps TaskCard with draggable behavior
- **Collision Detection**: `rectIntersection` strategy (handles scrollable containers better than `closestCorners`)

#### Event Flow
```
User drags task
  ↓
onDragStart: Sets activeId for visual overlay
  ↓
onDragEnd: Detects drop target column
  ↓
If valid: socket.emit('task:move', { id, status })
  ↓
Server updates task.status
  ↓
Server broadcasts updated tasks
  ↓
All clients re-render with new positions
```

#### Key Features
- **Visual Feedback**: Drag overlay shows task while dragging
- **Drop Zones**: Columns highlight when valid drop target
- **Scroll Support**: Works with scrollable columns (600px max-height)
- **Server Validation**: Column status validated on server

### 3. Multi-Client Real-time Synchronization

**Mechanism**: Socket.IO broadcasts ensure all clients see identical state

#### Sync Events
- `tasks:synced`: Full task array broadcast (on connect, create, update, delete, move)
- `error`: Server validation failure notification
- `disconnect`: Connection loss handling

#### Consistency Strategy
- **No Client-Side Caching**: Tasks are only stored on server
- **Full State Sync**: Every change sends complete task list (simple, predictable)
- **Race Condition Prevention**: Server is single source of truth, no client optimistic updates

#### Connection Handling
```javascript
// App.jsx connection lifecycle
useEffect(() => {
  const newSocket = io(SOCKET_URL);
  
  newSocket.on('connect', () => {
    setError(null);
    newSocket.emit('sync:tasks'); // Request initial state
  });
  
  newSocket.on('tasks:synced', (tasks) => {
    setTasks(tasks);
    setLoading(false);
  });
  
  newSocket.on('connect_error', (error) => {
    setError('Failed to connect to server');
  });
  
  return () => newSocket.close(); // Cleanup on unmount
}, []);
```

### 4. Priority and Category System

**Purpose**: Task organization and visual classification

#### Priority Levels
- **High**: Red badge, indicates urgent work
- **Medium**: Orange/yellow badge, normal priority (default)
- **Low**: Green badge, backlog items

#### Categories
- **Bug**: Red, defects/issues
- **Feature**: Blue, new functionality (default)
- **Enhancement**: Purple, improvements to existing features

**Implementation**: React-Select dropdowns with custom styling, stored as strings in task objects

### 5. File Attachment Handling

**Storage**: Base64-encoded data URLs (client-side simulation, no real upload)

#### Supported Types
- Images: PNG, JPEG, JPG, GIF
- Documents: PDF

#### Validation
- **File Type**: Must match allowed types
- **File Size**: Max 5MB per file
- **Multiple Files**: Supported, attachments stored as array

#### Display
- **Images**: Thumbnail preview with lightbox capability
- **PDFs**: File icon with name
- **Actions**: Remove attachment button (×)

### 6. Task Progress Visualization

**Component**: `TaskProgressChart`

#### Metrics Displayed
1. **Task Distribution** (Bar Chart):
   - To Do count (blue)
   - In Progress count (orange)
   - Done count (green)

2. **Completion Status** (Pie Chart):
   - Percentage of tasks in "Done" column
   - Visual breakdown of todo vs completed

**Library**: Recharts (responsive charts)  
**Update Trigger**: Automatically recalculates when `tasks` prop changes

---

## WebSocket Event Flow

### Socket Event Pipeline

```
CLIENT                          SERVER                          ALL CLIENTS
  │                               │                                  │
  ├─ emit('task:create', data)──→│                                  │
  │                               ├─ Validate data                  │
  │                               ├─ Generate UUID                  │
  │                               ├─ Add to tasks[]                 │
  │                               ├─ emit('tasks:synced', tasks)───→│
  │                               │                                  ├─ setTasks(tasks)
  │                               │                                  └─ Re-render UI
```

### Event Contract

#### Client → Server Events

| Event | Payload | Purpose |
|-------|---------|---------|
| `sync:tasks` | `undefined` | Request initial task list |
| `task:create` | `{ title, description, priority, category, status, attachments }` | Create new task |
| `task:update` | `{ id, title, description, priority, category, attachments }` | Update existing task |
| `task:move` | `{ id, status }` | Change task column |
| `task:delete` | `taskId` (string) | Delete task |

#### Server → Client Events

| Event | Payload | Purpose |
|-------|---------|---------|
| `tasks:synced` | `tasks[]` | Full task array (source of truth) |
| `error` | `{ message: string }` | Validation or server error |
| `disconnect` | `undefined` | Connection lost |
| `connect_error` | `error` | Connection failed |

### Consistency Maintenance

**Strategy**: Server broadcasts full state on every change

```javascript
// Server: Always broadcast after mutations
socket.on('task:create', (taskData) => {
  // 1. Validate
  const validation = validateTask(taskData);
  if (!validation.valid) {
    socket.emit('error', { message: validation.error });
    return;
  }
  
  // 2. Mutate server state
  const newTask = { id: uuidv4(), ...taskData, createdAt: new Date().toISOString() };
  tasks.push(newTask);
  
  // 3. Broadcast to ALL clients (including sender)
  io.emit('tasks:synced', tasks);
});
```

**Benefits**:
- Simple to reason about
- No drift between clients
- Easy to debug (inspect server state)

**Trade-offs**:
- Sends full array on every change (fine for <1000 tasks)
- No partial updates (could optimize later)

### Error Handling Strategy

#### Server-Side Validation
```javascript
const validateTask = (task) => {
  if (!task.title || task.title.trim() === '') {
    return { valid: false, error: 'Title is required' };
  }
  const validStatuses = ['todo', 'inProgress', 'done'];
  if (!validStatuses.includes(task.status)) {
    return { valid: false, error: 'Invalid status' };
  }
  return { valid: true };
};
```

#### Client-Side Error Display
- `error` state in App.jsx
- Red error banner at top of Kanban board
- Connection errors show loading state with retry capability

---

## Testing Strategy

### Test Pyramid

```
              ┌──────────────┐
              │  E2E Tests   │  (Playwright - User flows)
              │   7 tests    │
              └──────────────┘
         ┌────────────────────────┐
         │  Integration Tests     │  (Component + Socket)
         │      7 tests           │
         └────────────────────────┘
    ┌───────────────────────────────────┐
    │       Unit Tests                  │  (Component behavior)
    │        28 tests                   │
    └───────────────────────────────────┘
```

**Total: 42 tests**

### Unit Tests

#### KanbanBoard Tests (`KanbanBoard.test.jsx`)
**What**: Component rendering with different prop combinations  
**Why**: Ensure props-based architecture works correctly  
**Examples**:
- Renders loading state when `loading={true}`
- Displays error when `error` prop provided
- Shows three columns when loaded
- Displays tasks in correct columns by status
- Shows empty state when no tasks

#### TaskCard Tests (`TaskCard.test.jsx`)
**What**: Task card display and interactions  
**Why**: Validate task presentation and action triggers  
**Examples**:
- Renders task title, description, badges
- Shows priority and category with correct classes
- Displays image attachments
- Calls `onEdit` when edit button clicked
- Calls `onDelete` with full task object (no confirmation at this level)

#### TaskForm Tests (`TaskForm.test.jsx`)
**What**: Task creation/editing form behavior  
**Why**: Ensure form validation and data handling  
**Examples**:
- Displays "Create New Task" for new tasks
- Shows "Edit Task" when editing
- Pre-fills form fields when editing
- Validates required title field
- Handles priority/category selection
- Manages file attachments

#### Column Tests (`Column.test.jsx`)
**What**: Column rendering and task filtering  
**Why**: Verify droppable container setup  
**Examples**:
- Renders column title and task count
- Filters tasks by status
- Shows empty state
- Has droppable zone configured

### Integration Tests

#### WebSocket Integration Tests (`WebSocketIntegration.test.jsx`)
**What**: Component behavior with mocked WebSocket  
**Why**: Validate event emission without real server  
**Examples**:
- Creates task via WebSocket emit
- Updates tasks when server sends sync event
- Emits delete event when task deleted
- Handles server errors gracefully
- Displays correct task counts in columns
- Filters tasks by status into correct columns
- Emits update event when task edited

**Architecture**: Pass mocked `socket` object as prop to KanbanBoard

### E2E Tests (Playwright)

#### Full User Flows (`e2e/kanban.spec.js`)
**What**: Browser-based end-to-end tests with real server  
**Why**: Validate complete system integration  
**Examples**:
- Create task flow (click, fill form, submit)
- Drag task between columns
- Edit existing task
- Delete task with confirmation
- Multi-client synchronization (two tabs)
- Chart updates after task changes
- Connection error handling

**Setup**: Launches local server, opens browser, simulates real user actions

### Running Tests

```bash
# Unit + Integration tests (Vitest)
cd frontend
npm run test

# E2E tests (Playwright)
npm run test:e2e

# Watch mode (development)
npm run test:watch

# Coverage report
npm run test:coverage
```

### Expected Outcomes

✅ **All 42 tests passing**
- 28 unit tests
- 7 integration tests  
- 7 E2E tests

**Coverage targets**:
- Components: >80%
- Critical paths (task CRUD): 100%
- WebSocket event handlers: 100%

---

## Flow Diagrams

### Task Creation Flow

```
┌─────────────────────────────────────────────────────────┐
│                   Task Creation Flow                     │
└─────────────────────────────────────────────────────────┘

USER                  CLIENT                  SERVER         ALL CLIENTS
 │                      │                       │                │
 ├─ Click "+ Add Task"─→│                       │                │
 │                      ├─ Open TaskForm        │                │
 │                      │   modal               │                │
 ├─ Fill form────────→  │                       │                │
 ├─ Click "Create"────→ │                       │                │
 │                      ├─ Validate locally     │                │
 │                      ├─ emit('task:create',  │                │
 │                      │   {title, desc,...})─→│                │
 │                      │                       ├─ Validate      │
 │                      │                       ├─ id=uuid()     │
 │                      │                       ├─ tasks.push()  │
 │                      │                       ├─ emit('tasks:  │
 │                      │                       │   synced')────→│
 │                      │←──────────────────────┼────────────────┤
 │                      ├─ setTasks(newTasks)   │                │
 │                      ├─ Close modal          │                │
 │                      ├─ Re-render UI         │                │
 │←─ See new task ──────┤                       │                │
```

### Drag-and-Drop Flow

```
┌─────────────────────────────────────────────────────────┐
│                 Drag-and-Drop Flow                       │
└─────────────────────────────────────────────────────────┘

USER                  CLIENT                  SERVER         ALL CLIENTS
 │                      │                       │                │
 ├─ Grab task card ────→│                       │                │
 │                      ├─ onDragStart()        │                │
 │                      ├─ Show overlay         │                │
 ├─ Drag to column ────→│                       │                │
 │                      ├─ Highlight drop zone  │                │
 ├─ Release mouse ─────→│                       │                │
 │                      ├─ onDragEnd()          │                │
 │                      ├─ Check if different   │                │
 │                      │   column              │                │
 │                      ├─ emit('task:move',    │                │
 │                      │   {id, status})──────→│                │
 │                      │                       ├─ Find task     │
 │                      │                       ├─ Update status │
 │                      │                       ├─ emit('tasks:  │
 │                      │                       │   synced')────→│
 │                      │←──────────────────────┼────────────────┤
 │                      ├─ setTasks()           │                │
 │                      ├─ React re-renders     │                │
 │                      ├─ Task appears in      │                │
 │                      │   new column          │                │
 │←─ See task move ─────┤                       │                │
```

### Multi-Client Synchronization

```
┌────────────────────────────────────────────────────────────────┐
│              Multi-Client Synchronization                       │
└────────────────────────────────────────────────────────────────┘

CLIENT A          CLIENT B          SERVER          
   │                 │                  │
   ├─ Connected ─────┤                  │
   │                 │                  │
   ├─ emit('task:create')──────────────→│
   │                 │                  ├─ tasks.push()
   │                 │                  ├─ io.emit('tasks:synced')
   │←────────────────┼──────────────────┤
   │                 │←─────────────────┤
   ├─ setTasks()     │                  │
   │                 ├─ setTasks()      │
   ├─ Re-render      │                  │
   │                 ├─ Re-render       │
   │                 │                  │
   │ Both clients now have identical task state
```

### Task Deletion with Confirmation

```
┌─────────────────────────────────────────────────────────┐
│            Task Deletion with Confirmation               │
└─────────────────────────────────────────────────────────┘

USER                  KANBANBOARD           CONFIRMATION      SERVER
 │                         │                   MODAL           │
 ├─ Click delete (🗑️)─────→│                     │             │
 │                         ├─ setDeleteConfirmation            │
 │                         │   {isOpen:true, id, title}        │
 │                         ├─ Render modal───→  │             │
 │←─ See modal ────────────┼────────────────────┤             │
 │                         │                    │             │
 ├─ Click "Delete"────────→│                    │             │
 │                         │←─ onConfirm()──────┤             │
 │                         ├─ emit('task:delete', id)────────→│
 │                         ├─ Close modal       │             │
 │                         │                    │             ├─ Remove task
 │                         │                    │             ├─ emit('tasks:
 │                         │←───────────────────┼─────────────┤  synced')
 │                         ├─ setTasks()        │             │
 │                         ├─ Re-render         │             │
 │←─ Task removed ─────────┤                    │             │
```

---

## Developer Setup Guide

### Prerequisites

```bash
Node.js >= 16.x
npm >= 8.x
```

### Installation

#### 1. Clone the repository
```bash
git clone <repository-url>
cd websocket-kanban-vitest-playwright-2026
```

#### 2. Install backend dependencies
```bash
cd backend
npm install
```

#### 3. Install frontend dependencies
```bash
cd ../frontend
npm install
```

### Running the Application

#### Start Backend Server
```bash
cd backend
npm start
# Server runs on http://localhost:3001
```

#### Start Frontend Development Server
```bash
cd frontend
npm run dev
# Frontend runs on http://localhost:3000
```

#### Open Application
Navigate to `http://localhost:3000` in your browser

**Testing Multi-Client Sync**:
Open multiple browser tabs/windows to `http://localhost:3000` and observe real-time synchronization

### Running Tests

#### Unit + Integration Tests (Vitest)
```bash
cd frontend

# Run all tests once
npm run test

# Watch mode (re-runs on file changes)
npm run test:watch

# Coverage report
npm run test:coverage
```

#### E2E Tests (Playwright)
```bash
cd frontend

# Install Playwright browsers (first time only)
npx playwright install

# Run E2E tests
npm run test:e2e

# Run in headed mode (see browser)
npm run test:e2e -- --headed

# Run specific test file
npx playwright test e2e/kanban.spec.js
```

### Project Structure

```
websocket-kanban-vitest-playwright-2026/
├── backend/
│   ├── server.js           # WebSocket server + task logic
│   ├── package.json
│   └── node_modules/
│
├── frontend/
│   ├── src/
│   │   ├── App.jsx                    # Root component, WebSocket connection
│   │   ├── index.css                  # Global styles
│   │   ├── components/
│   │   │   ├── KanbanBoard.jsx        # Main board orchestration
│   │   │   ├── Column.jsx             # Droppable column
│   │   │   ├── TaskCard.jsx           # Task display
│   │   │   ├── SortableTaskCard.jsx   # Drag wrapper
│   │   │   ├── TaskForm.jsx           # Create/edit modal
│   │   │   ├── ConfirmationModal.jsx  # Delete confirmation
│   │   │   └── TaskProgressChart.jsx  # Visual analytics
│   │   │
│   │   └── tests/
│   │       ├── unit/                  # Component tests
│   │       ├── integration/           # WebSocket tests
│   │       └── e2e/                   # Playwright tests
│   │
│   ├── package.json
│   ├── vite.config.js
│   └── playwright.config.js
│
└── DOCUMENTATION.md (this file)
```

### Environment Configuration

**Backend**:
- Default port: `3001`
- CORS enabled for `http://localhost:3000`
- No environment variables needed for basic setup

**Frontend**:
- Default port: `3000` (Vite dev server)
- WebSocket URL: `http://localhost:3001` (hardcoded in `App.jsx`)

To change ports, update:
- Backend: `server.js` → `const PORT = 3001`
- Frontend: `App.jsx` → `const SOCKET_URL = 'http://localhost:3001'`

---

## Known Design Decisions

### 1. Why WebSockets?

**Requirement**: Real-time multi-client synchronization

**Alternatives Considered**:
- HTTP polling: Too much latency, inefficient
- Server-Sent Events (SSE): One-way only, no bi-directional communication
- Long polling: Resource intensive, complex

**Choice: WebSockets via Socket.IO**
- **Pros**: Bi-directional, low latency, automatic reconnection, fallback to polling
- **Cons**: More complex than REST, requires persistent connections
- **Justification**: Real-time collaborative features are core requirements

### 2. Drag-and-Drop Architecture

**Library**: `@dnd-kit/core` + `@dnd-kit/sortable`

**Why Not HTML5 Drag-and-Drop?**
- Poor mobile support
- Limited styling control
- Accessibility issues

**Why @dnd-kit?**
- ✅ Modern, hook-based API
- ✅ Excellent accessibility
- ✅ Works with React 18
- ✅ Flexible collision detection strategies
- ✅ Good TypeScript support

**Key Decision: `rectIntersection` over `closestCorners`**
- `closestCorners` failed with scrollable containers (2-task limit bug)
- `rectIntersection` checks bounding box overlap, more reliable for scrolling columns

### 3. State Management Approach

**Strategy**: Lift state to App.jsx, pass down as props

**Why Not Redux/Zustand/Context?**
- App is small enough for prop drilling
- Single WebSocket connection simplifies logic
- Easier to test with props
- Less boilerplate

**Trade-off**: If app grows beyond 10 components, consider Context or state library

**Server as Source of Truth**:
- Client NEVER mutates state locally
- All changes go through WebSocket → server → broadcast
- **Result**: Predictable, debuggable, consistent

### 4. Testing Strategy Reasoning

#### Why Vitest over Jest?
- Faster (uses Vite's transform pipeline)
- Better ES module support
- First-class Vite integration

#### Why Playwright over Cypress?
- Multi-browser support (Chromium, Firefox, WebKit)
- Better for testing real WebSocket connections
- Faster execution
- Better debugging tools

#### Props-Based Testing
**Decision**: Pass mocked `socket` and `tasks` as props instead of mocking `socket.io-client`

**Rationale**:
- Tests component behavior, not implementation
- Easier to set up different scenarios
- Faster test execution (no real socket connection)
- More maintainable

```javascript
// Good: Props-based
render(<KanbanBoard socket={mockSocket} tasks={tasks} />);

// Avoid: Mocking modules
vi.mock('socket.io-client', () => ({ io: mockSocket }));
```

### 5. In-Memory Storage (No Database)

**Current**: Tasks stored in memory (`tasks[]` in `server.js`)

**Trade-offs**:
- ✅ Simple, no setup
- ✅ Fast
- ❌ Data lost on server restart
- ❌ Doesn't scale beyond single process

**When to Migrate**: If persistence or multi-instance deployment needed, add MongoDB/PostgreSQL

---

## Extension Guide

### How to Add New Features

#### 1. Adding a New Task Field

**Example**: Add "assignee" field

**Steps**:
1. **Update Backend Validation** (`backend/server.js`):
```javascript
const newTask = {
  id: uuidv4(),
  title: taskData.title,
  assignee: taskData.assignee || 'Unassigned', // Add this
  // ... other fields
};
```

2. **Update TaskForm** (`frontend/src/components/TaskForm.jsx`):
```javascript
const [formData, setFormData] = useState({
  // ... existing fields
  assignee: task?.assignee || 'Unassigned'
});

// Add input field in JSX
<input
  name="assignee"
  value={formData.assignee}
  onChange={handleChange}
/>
```

3. **Update TaskCard Display** (`frontend/src/components/TaskCard.jsx`):
```javascript
<p>{task.assignee}</p>
```

4. **Write Tests**: Add test cases for new field validation

#### 2. Adding a New WebSocket Event

**Example**: Add "task:archive" event

**Backend** (`server.js`):
```javascript
socket.on('task:archive', (taskId) => {
  const task = tasks.find(t => t.id === taskId);
  if (task) {
    task.archived = true;
    io.emit('tasks:synced', tasks);
  }
});
```

**Frontend** (`KanbanBoard.jsx`):
```javascript
const handleArchiveTask = (taskId) => {
  if (socket) {
    socket.emit('task:archive', taskId);
  }
};
```

#### 3. Adding a New Column

**Example**: Add "Blocked" column

1. **Update Column Status Enum**:
```javascript
// server.js
const validStatuses = ['todo', 'inProgress', 'blocked', 'done'];

// Column.jsx
const columnTitles = {
  todo: 'To Do',
  inProgress: 'In Progress',
  blocked: 'Blocked',
  done: 'Done'
};
```

2. **Add Column Component**:
```javascript
// KanbanBoard.jsx
<Column
  status="blocked"
  tasks={getTasksByStatus('blocked')}
  onAddTask={handleAddTask}
  // ...
/>
```

3. **Update CSS**: Add styling for `.blocked` status indicator

### Safe Modification Points

✅ **Safe to Modify**:
- Component styling (CSS)
- Task form fields
- Chart visualizations
- Validation rules (backend + frontend)
- Column titles/colors
- Priority/Category options

⚠️ **Modify with Care**:
- WebSocket event names (must match client/server)
- Task object structure (affects all components)
- Drag-and-drop collision detection
- State lifecycle (App.jsx)

❌ **Avoid Modifying Without Full Understanding**:
- WebSocket connection logic (`App.jsx` useEffect)
- Server broadcast mechanism (`io.emit`)
- Drag-and-drop context providers
- Test mocking architecture

### Where to Hook Into Event Flow

#### Add Custom Validation
**File**: `backend/server.js` → `validateTask()` function

#### Add UI Feedback
**File**: `frontend/src/components/KanbanBoard.jsx` → socket event handlers

#### Add Analytics
**File**: `frontend/src/App.jsx` → subscribe to `tasks:synced` event

#### Add Persistence
**File**: `backend/server.js` → wrap task mutations with database calls

### Debugging Tips

#### Check WebSocket Connection
```javascript
// In browser console
window.io // Should exist if connected
```

#### Monitor Socket Events
```javascript
// Add to App.jsx
socket.onAny((event, ...args) => {
  console.log('Socket event:', event, args);
});
```

#### Inspect Task State
```javascript
// React DevTools → App component → hooks → tasks
```

#### View Network Traffic
- Browser DevTools → Network tab → WS filter
- See WebSocket messages in real-time

---

## Conclusion

This Kanban board demonstrates a **production-ready real-time collaborative application** with:
- Clean architecture (props-based state flow)
- Comprehensive testing (unit, integration, E2E)
- Modern tooling (Vite, Vitest, Playwright)
- Scalable WebSocket architecture

**Next Steps for Production**:
1. Add database persistence (MongoDB/PostgreSQL)
2. Implement user authentication (JWT)
3. Add task search/filtering
4. Optimize broadcasts (send diffs instead of full array)
5. Deploy with Docker + load balancer for horizontal scaling

For questions or contributions, refer to the code comments and test files for detailed implementation examples.
