import React, { useState } from 'react';
import { Exercise } from '../types';

interface ExerciseEditProps {
  exerciseName: string;
  exercise: Exercise;
  onSave: (exerciseName: string, customTitle: string, customNote: string) => void;
  onClose: () => void;
}

const ExerciseEdit: React.FC<ExerciseEditProps> = ({
  exerciseName,
  exercise,
  onSave,
  onClose,
}) => {
  const [customTitle, setCustomTitle] = useState(exerciseName);
  const [customNote, setCustomNote] = useState(exercise.note || '');

  const handleSave = () => {
    onSave(exerciseName, customTitle.trim(), customNote.trim());
    onClose();
  };

  const handleCancel = () => {
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content exercise-edit-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>ערוך תרגיל</h2>
          <button className="modal-close-btn" onClick={onClose}>×</button>
        </div>
        
        <div className="modal-body">
          <div className="edit-form">
            <div className="form-group">
              <label className="form-label">שם התרגיל:</label>
              <input
                type="text"
                value={customTitle}
                onChange={(e) => setCustomTitle(e.target.value)}
                className="form-input"
                placeholder="הכנס שם תרגיל"
                autoFocus
              />
            </div>
            
            <div className="form-group">
              <label className="form-label">הערות:</label>
              <textarea
                value={customNote}
                onChange={(e) => setCustomNote(e.target.value)}
                className="form-textarea"
                placeholder="הכנס הערות לתרגיל (אופציונלי)"
                rows={4}
              />
            </div>
          </div>
          
          <div className="edit-actions">
            <button 
              className="cancel-button"
              onClick={handleCancel}
            >
              ביטול
            </button>
            <button 
              className="save-button"
              onClick={handleSave}
              disabled={!customTitle.trim()}
            >
              שמור
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExerciseEdit;
