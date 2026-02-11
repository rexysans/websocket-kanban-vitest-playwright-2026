import React, { useState } from 'react';
import Select from 'react-select';

const priorityOptions = [
  { value: 'Low', label: 'Low Priority', color: '#10b981' },
  { value: 'Medium', label: 'Medium Priority', color: '#f59e0b' },
  { value: 'High', label: 'High Priority', color: '#ef4444' }
];

const categoryOptions = [
  { value: 'Bug', label: 'Bug', color: '#ef4444' },
  { value: 'Feature', label: 'Feature', color: '#3b82f6' },
  { value: 'Enhancement', label: 'Enhancement', color: '#8b5cf6' }
];

const selectStyles = {
  control: (base, state) => ({
    ...base,
    background: '#1a1f3a',
    borderColor: state.isFocused ? '#3b82f6' : 'rgba(148, 163, 184, 0.1)',
    boxShadow: state.isFocused ? '0 0 0 3px rgba(59, 130, 246, 0.3)' : 'none',
    '&:hover': {
      borderColor: '#3b82f6'
    }
  }),
  menu: (base) => ({
    ...base,
    background: '#131829',
    border: '1px solid rgba(148, 163, 184, 0.1)',
  }),
  option: (base, state) => ({
    ...base,
    background: state.isFocused ? 'rgba(59, 130, 246, 0.1)' : '#131829',
    color: '#e2e8f0',
    '&:hover': {
      background: 'rgba(59, 130, 246, 0.1)'
    }
  }),
  singleValue: (base) => ({
    ...base,
    color: '#e2e8f0'
  }),
  placeholder: (base) => ({
    ...base,
    color: '#64748b'
  })
};

function TaskForm({ task, onSubmit, onCancel, columnStatus = 'todo' }) {
  const [formData, setFormData] = useState({
    title: task?.title || '',
    description: task?.description || '',
    priority: task?.priority || 'Medium',
    category: task?.category || 'Feature',
    status: task?.status || columnStatus,
    attachments: task?.attachments || []
  });

  const [errors, setErrors] = useState({});
  const [fileError, setFileError] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleSelectChange = (name, option) => {
    setFormData(prev => ({ ...prev, [name]: option.value }));
  };

  const handleFileUpload = (e) => {
    const files = Array.from(e.target.files);
    setFileError('');

    const validFiles = [];
    const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/gif', 'application/pdf'];
    const maxSize = 5 * 1024 * 1024; // 5MB

    for (const file of files) {
      if (!allowedTypes.includes(file.type)) {
        setFileError(`Invalid file type: ${file.name}. Only images and PDFs are allowed.`);
        continue;
      }

      if (file.size > maxSize) {
        setFileError(`File too large: ${file.name}. Maximum size is 5MB.`);
        continue;
      }

      // Convert to base64 for storage (simulated)
      const reader = new FileReader();
      reader.onload = (event) => {
        validFiles.push({
          name: file.name,
          type: file.type,
          url: event.target.result
        });

        if (validFiles.length === files.filter(f => 
          allowedTypes.includes(f.type) && f.size <= maxSize
        ).length) {
          setFormData(prev => ({
            ...prev,
            attachments: [...prev.attachments, ...validFiles]
          }));
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const removeAttachment = (index) => {
    setFormData(prev => ({
      ...prev,
      attachments: prev.attachments.filter((_, i) => i !== index)
    }));
  };

  const validate = () => {
    const newErrors = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!validate()) {
      return;
    }

    onSubmit(task ? { ...formData, id: task.id } : formData);
  };

  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <h2 style={{ marginBottom: '1.5rem', fontSize: '1.5rem', fontWeight: 600 }}>
          {task ? 'Edit Task' : 'Create New Task'}
        </h2>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">
              Title <span style={{ color: '#ef4444' }}>*</span>
            </label>
            <input
              type="text"
              name="title"
              className="form-input"
              value={formData.title}
              onChange={handleChange}
              placeholder="Enter task title"
            />
            {errors.title && (
              <span style={{ color: '#ef4444', fontSize: '0.875rem', marginTop: '0.25rem', display: 'block' }}>
                {errors.title}
              </span>
            )}
          </div>

          <div className="form-group">
            <label className="form-label">Description</label>
            <textarea
              name="description"
              className="form-textarea"
              value={formData.description}
              onChange={handleChange}
              placeholder="Enter task description"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Priority</label>
            <Select
              options={priorityOptions}
              value={priorityOptions.find(o => o.value === formData.priority)}
              onChange={(option) => handleSelectChange('priority', option)}
              styles={selectStyles}
              className="react-select-container"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Category</label>
            <Select
              options={categoryOptions}
              value={categoryOptions.find(o => o.value === formData.category)}
              onChange={(option) => handleSelectChange('category', option)}
              styles={selectStyles}
              className="react-select-container"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Attachments</label>
            <div className="file-upload" onClick={() => document.getElementById('file-input').click()}>
              <input
                id="file-input"
                type="file"
                multiple
                accept="image/*,application/pdf"
                onChange={handleFileUpload}
              />
              <p style={{ color: '#94a3b8' }}>📎 Click to upload files (Images or PDFs, max 5MB)</p>
            </div>
            {fileError && (
              <div style={{ color: '#ef4444', fontSize: '0.875rem', marginTop: '0.5rem' }}>
                {fileError}
              </div>
            )}
            {formData.attachments.length > 0 && (
              <div className="file-preview">
                {formData.attachments.map((file, index) => (
                  <div key={index} style={{ position: 'relative' }}>
                    {file.type.startsWith('image/') ? (
                      <img src={file.url} alt={file.name} />
                    ) : (
                      <div className="attachment-file">
                        📄 {file.name}
                      </div>
                    )}
                    <button
                      type="button"
                      onClick={() => removeAttachment(index)}
                      style={{
                        position: 'absolute',
                        top: '-5px',
                        right: '-5px',
                        background: '#ef4444',
                        color: 'white',
                        border: 'none',
                        borderRadius: '50%',
                        width: '20px',
                        height: '20px',
                        cursor: 'pointer',
                        fontSize: '12px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="form-actions">
            <button type="button" className="btn btn-secondary" onClick={onCancel}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              {task ? 'Update Task' : 'Create Task'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default TaskForm;
