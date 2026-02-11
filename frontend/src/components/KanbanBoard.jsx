import React, { useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import { DndContext, DragOverlay, closestCorners, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { arrayMove } from '@dnd-kit/sortable';
import Column from './Column';
import TaskForm from './TaskForm';
import TaskCard from './TaskCard';

const SOCKET_URL = 'http://localhost:5000';

function KanbanBoard() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [socket, setSocket] = useState(null);
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [selectedColumn, setSelectedColumn] = useState('todo');
  const [activeId, setActiveId] = useState(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  // Initialize WebSocket connection
  useEffect(() => {
    const newSocket = io(SOCKET_URL, {
      transports: ['websocket', 'polling']
    });

    newSocket.on('connect', () => {
      console.log('✅ Connected to WebSocket server');
      setLoading(false);
      setError(null);
      newSocket.emit('sync:tasks');
    });

    newSocket.on('tasks:synced', (syncedTasks) => {
      console.log('📋 Tasks synced:', syncedTasks.length);
      setTasks(syncedTasks);
    });

    newSocket.on('error', (errorData) => {
      console.error('❌ Server error:', errorData);
      setError(errorData.message);
    });

    newSocket.on('disconnect', () => {
      console.log('⚠️ Disconnected from server');
      setLoading(true);
    });

    newSocket.on('connect_error', (err) => {
      console.error('❌ Connection error:', err);
      setError('Failed to connect to server. Make sure the backend is running on port 5000.');
      setLoading(false);
    });

    setSocket(newSocket);

    return () => {
      newSocket.close();
    };
  }, []);

  const handleAddTask = (status) => {
    setSelectedColumn(status);
    setEditingTask(null);
    setShowTaskForm(true);
  };

  const handleEditTask = (task) => {
    setEditingTask(task);
    setShowTaskForm(true);
  };

  const handleDeleteTask = (taskId) => {
    if (socket) {
      socket.emit('task:delete', taskId);
    }
  };

  const handleFormSubmit = (taskData) => {
    if (socket) {
      if (editingTask) {
        // Update existing task
        socket.emit('task:update', taskData);
      } else {
        // Create new task
        socket.emit('task:create', taskData);
      }
    }
    setShowTaskForm(false);
    setEditingTask(null);
  };

  const handleFormCancel = () => {
    setShowTaskForm(false);
    setEditingTask(null);
  };

  const handleDragStart = (event) => {
    setActiveId(event.active.id);
  };

  const handleDragOver = (event) => {
    const { active, over } = event;

    if (!over) return;

    const activeId = active.id;
    const overId = over.id;

    // Check if we're dragging over a column
    const columns = ['todo', 'inProgress', 'done'];
    if (columns.includes(overId)) {
      const task = tasks.find(t => t.id === activeId);
      if (task && task.status !== overId) {
        // Update task status locally for smooth UX
        setTasks(prevTasks => 
          prevTasks.map(t => 
            t.id === activeId ? { ...t, status: overId } : t
          )
        );
      }
    }
  };

  const handleDragEnd = (event) => {
    const { active, over } = event;
    
    setActiveId(null);

    if (!over) return;

    const activeId = active.id;
    const overId = over.id;

    const task = tasks.find(t => t.id === activeId);
    if (!task) return;

    // Check if we dropped on a column
    const columns = ['todo', 'inProgress', 'done'];
    if (columns.includes(overId) && task.status !== overId) {
      // Emit task move to server
      if (socket) {
        socket.emit('task:move', { id: activeId, status: overId });
      }
    }
  };

  const getTasksByStatus = (status) => {
    return tasks.filter(task => task.status === status);
  };

  const activeTask = activeId ? tasks.find(t => t.id === activeId) : null;

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p style={{ marginTop: '1rem' }}>Connecting to server...</p>
      </div>
    );
  }

  return (
    <div className="kanban-board">
      {error && (
        <div className="error-container">
          <strong>Error:</strong> {error}
        </div>
      )}

      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        <div className="kanban-columns">
          <Column
            status="todo"
            tasks={getTasksByStatus('todo')}
            onAddTask={handleAddTask}
            onEditTask={handleEditTask}
            onDeleteTask={handleDeleteTask}
          />
          <Column
            status="inProgress"
            tasks={getTasksByStatus('inProgress')}
            onAddTask={handleAddTask}
            onEditTask={handleEditTask}
            onDeleteTask={handleDeleteTask}
          />
          <Column
            status="done"
            tasks={getTasksByStatus('done')}
            onAddTask={handleAddTask}
            onEditTask={handleEditTask}
            onDeleteTask={handleDeleteTask}
          />
        </div>

        <DragOverlay>
          {activeTask ? (
            <div style={{ cursor: 'grabbing' }}>
              <TaskCard task={activeTask} onEdit={() => {}} onDelete={() => {}} />
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>

      {showTaskForm && (
        <TaskForm
          task={editingTask}
          onSubmit={handleFormSubmit}
          onCancel={handleFormCancel}
          columnStatus={selectedColumn}
        />
      )}
    </div>
  );
}

export default KanbanBoard;
