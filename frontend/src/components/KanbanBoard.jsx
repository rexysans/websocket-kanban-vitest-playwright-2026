import React, { useState } from 'react';
import { DndContext, DragOverlay, closestCorners, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import Column from './Column';
import TaskForm from './TaskForm';
import TaskCard from './TaskCard';
import ConfirmationModal from './ConfirmationModal';

function KanbanBoard({ socket, tasks, loading, error }) {
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [selectedColumn, setSelectedColumn] = useState('todo');
  const [activeId, setActiveId] = useState(null);
  const [deleteConfirmation, setDeleteConfirmation] = useState({ isOpen: false, taskId: null, taskTitle: '' });

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

  const handleDeleteRequest = (task) => {
    setDeleteConfirmation({
      isOpen: true,
      taskId: task.id,
      taskTitle: task.title
    });
  };

  const handleDeleteConfirm = () => {
    if (socket && deleteConfirmation.taskId) {
      console.log('🗑️ Deleting task:', deleteConfirmation.taskId);
      socket.emit('task:delete', deleteConfirmation.taskId);
    }
    setDeleteConfirmation({ isOpen: false, taskId: null, taskTitle: '' });
  };

  const handleDeleteCancel = () => {
    setDeleteConfirmation({ isOpen: false, taskId: null, taskTitle: '' });
  };

  const handleFormSubmit = (taskData) => {
    if (socket) {
      if (editingTask) {
        console.log('✏️ Updating task:', taskData.id);
        socket.emit('task:update', taskData);
      } else {
        console.log('➕ Creating task:', taskData.title);
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
    console.log('🎯 Drag started:', event.active.id);
  };

  const handleDragEnd = (event) => {
    const { active, over } = event;
    
    setActiveId(null);

    if (!over) {
      console.log('⚠️ Dropped outside droppable area');
      return;
    }

    const activeId = active.id;
    const overId = over.id;

    const task = tasks.find(t => t.id === activeId);
    if (!task) {
      console.log('⚠️ Task not found:', activeId);
      return;
    }

    // Check if we dropped on a column
    const columns = ['todo', 'inProgress', 'done'];
    if (columns.includes(overId) && task.status !== overId) {
      console.log(`🚀 Moving task ${task.title} from ${task.status} to ${overId}`);
      
      if (socket) {
        socket.emit('task:move', { id: activeId, status: overId });
      }
    } else {
      console.log('ℹ️ No move needed - same column or invalid drop target');
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
        onDragEnd={handleDragEnd}
      >
        <div className="kanban-columns">
          <Column
            status="todo"
            tasks={getTasksByStatus('todo')}
            onAddTask={handleAddTask}
            onEditTask={handleEditTask}
            onDeleteTask={handleDeleteRequest}
          />
          <Column
            status="inProgress"
            tasks={getTasksByStatus('inProgress')}
            onAddTask={handleAddTask}
            onEditTask={handleEditTask}
            onDeleteTask={handleDeleteRequest}
          />
          <Column
            status="done"
            tasks={getTasksByStatus('done')}
            onAddTask={handleAddTask}
            onEditTask={handleEditTask}
            onDeleteTask={handleDeleteRequest}
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

      <ConfirmationModal
        isOpen={deleteConfirmation.isOpen}
        onConfirm={handleDeleteConfirm}
        onCancel={handleDeleteCancel}
        title="🗑️ Delete Task"
        message={`Are you sure you want to delete "${deleteConfirmation.taskTitle}"? This action cannot be undone.`}
      />
    </div>
  );
}

export default KanbanBoard;
