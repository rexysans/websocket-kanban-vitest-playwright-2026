import React, { useState, useEffect } from 'react';
import { DndContext, DragOverlay, closestCorners, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import Column from './Column';
import TaskForm from './TaskForm';
import TaskCard from './TaskCard';

function KanbanBoard({ socket, tasks, loading, error }) {
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
    // We'll handle the actual move in handleDragEnd
    // This just provides visual feedback
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
      // Emit task move to server - server will broadcast the update
      if (socket) {
        console.log(`Moving task ${activeId} to ${overId}`);
        socket.emit('task:move', { id: activeId, status: overId });
      }
    }
  };

  const getTasksByStatus = (status) => {
    if (!tasks) return [];
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
