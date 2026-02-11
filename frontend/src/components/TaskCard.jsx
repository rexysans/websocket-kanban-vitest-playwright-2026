import React from 'react';

function TaskCard({ task, onEdit, onDelete }) {
  const handleEdit = (e) => {
    e.stopPropagation();
    onEdit(task);
  };

  const handleDelete = (e) => {
    e.stopPropagation();
    if (window.confirm('Are you sure you want to delete this task?')) {
      onDelete(task.id);
    }
  };

  return (
    <div className="task-card">
      <div className="task-header">
        <h3 className="task-title">{task.title}</h3>
        <div className="task-actions">
          <button className="task-action-btn" onClick={handleEdit} title="Edit task">
            ✏️
          </button>
          <button className="task-action-btn" onClick={handleDelete} title="Delete task">
            🗑️
          </button>
        </div>
      </div>

      {task.description && (
        <p className="task-description">{task.description}</p>
      )}

      <div className="task-meta">
        <span className={`badge priority-badge ${task.priority}`}>
          {task.priority}
        </span>
        <span className={`badge category-badge ${task.category}`}>
          {task.category}
        </span>
      </div>

      {task.attachments && task.attachments.length > 0 && (
        <div className="task-attachments">
          {task.attachments.map((file, index) => (
            file.type.startsWith('image/') ? (
              <img
                key={index}
                src={file.url}
                alt={file.name}
                className="attachment-preview"
                title={file.name}
              />
            ) : (
              <div key={index} className="attachment-file" title={file.name}>
                📄 {file.name.length > 12 ? file.name.substring(0, 12) + '...' : file.name}
              </div>
            )
          ))}
        </div>
      )}
    </div>
  );
}

export default TaskCard;
