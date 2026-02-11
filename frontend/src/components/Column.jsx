import React from 'react';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import SortableTaskCard from './SortableTaskCard';

const columnTitles = {
  todo: 'To Do',
  inProgress: 'In Progress',
  done: 'Done'
};

function Column({ status, tasks, onAddTask, onEditTask, onDeleteTask }) {
  const { setNodeRef } = useDroppable({
    id: status
  });

  const taskIds = tasks.map(task => task.id);

  return (
    <div className="kanban-column">
      <div className="column-header">
        <div className={`column-title ${status}`}>
          <span className="status-indicator"></span>
          {columnTitles[status]}
        </div>
        <span className="task-count">{tasks.length}</span>
      </div>

      <div className="column-tasks" ref={setNodeRef}>
        <SortableContext items={taskIds} strategy={verticalListSortingStrategy}>
          {tasks.length === 0 ? (
            <div className="empty-state">
              No tasks yet. Click below to add one!
            </div>
          ) : (
            tasks.map(task => (
              <SortableTaskCard
                key={task.id}
                task={task}
                onEdit={onEditTask}
                onDelete={onDeleteTask}
              />
            ))
          )}
        </SortableContext>
      </div>

      <button className="add-task-btn" onClick={() => onAddTask(status)}>
        + Add Task
      </button>
    </div>
  );
}

export default Column;
