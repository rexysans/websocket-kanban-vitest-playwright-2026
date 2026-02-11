import React from 'react';

function ConfirmationModal({ isOpen, onConfirm, onCancel, title, message }) {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal-content confirmation-modal" onClick={(e) => e.stopPropagation()}>
        <h2 style={{ marginBottom: '1rem', fontSize: '1.5rem', fontWeight: 600, color: '#ef4444' }}>
          {title || '⚠️ Confirm Action'}
        </h2>
        
        <p style={{ marginBottom: '2rem', color: '#94a3b8', lineHeight: '1.6' }}>
          {message || 'Are you sure you want to proceed?'}
        </p>

        <div className="form-actions">
          <button type="button" className="btn btn-secondary" onClick={onCancel}>
            Cancel
          </button>
          <button type="button" className="btn btn-danger" onClick={onConfirm}>
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}

export default ConfirmationModal;
