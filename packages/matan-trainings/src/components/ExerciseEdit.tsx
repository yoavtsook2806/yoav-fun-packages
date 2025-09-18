import React, { useState, useEffect } from 'react';
import { Exercise } from '../types';
import { getCustomExerciseTitle } from '../utils/exerciseHistory';

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
  const [customTitle, setCustomTitle] = useState('');
  const [customNote, setCustomNote] = useState('');

  useEffect(() => {
    // Initialize with existing custom title or fall back to original name
    const existingTitle = getCustomExerciseTitle(exerciseName);
    setCustomTitle(existingTitle);
    setCustomNote(exercise.note || '');
    
    console.log('ExerciseEdit initialized with:', {
      exerciseName,
      existingTitle,
      exerciseNote: exercise.note
    });
  }, [exerciseName, exercise]);

  const handleSave = () => {
    onSave(exerciseName, customTitle.trim(), customNote.trim());
    onClose();
  };

  const handleCancel = () => {
    onClose();
  };

  return (
    <div className="info-overlay">
      <div className="info-modal">
        <div className="info-header">
          <h2>ערוך תרגיל</h2>
          <button className="close-button" onClick={onClose}>
            ✕
          </button>
        </div>

        <div className="info-exercise-name">
          {getCustomExerciseTitle(exerciseName)}
        </div>

        <div className="info-content">
          <div className="edit-form">
            <div className="edit-input-group">
              <label className="edit-input-label">שם התרגיל</label>
              <input
                type="text"
                value={customTitle}
                onChange={(e) => setCustomTitle(e.target.value)}
                className="edit-input-field"
                placeholder="הכנס שם תרגיל"
                autoFocus
              />
            </div>

            <div className="edit-input-group">
              <label className="edit-input-label">הערות</label>
              <textarea
                value={customNote}
                onChange={(e) => setCustomNote(e.target.value)}
                className="edit-textarea-field"
                placeholder="הכנס הערות לתרגיל (אופציונלי)"
                rows={4}
              />
            </div>
          </div>
        </div>

        <div className="info-footer">
          <button
            className="setup-nav-btn cancel-edit-btn"
            onClick={handleCancel}
          >
            ביטול
          </button>
          <button
            className="setup-nav-btn save-edit-btn"
            onClick={handleSave}
            disabled={!customTitle.trim()}
          >
            שמור
          </button>
        </div>
      </div>
    </div>
  );
};

export default ExerciseEdit;
