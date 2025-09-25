import React from 'react';
import { getCustomExerciseTitle } from '../utils/exerciseHistory';

interface ExerciseModalProps {
  exerciseName: string;
  title: string;
  onClose: () => void;
  onEdit?: (exerciseName: string) => void;
  onBack?: () => void;
  children: React.ReactNode;
}

const ExerciseModal: React.FC<ExerciseModalProps> = ({
  exerciseName,
  title,
  onClose,
  onEdit,
  onBack,
  children,
}) => {
  return (
    <div className="info-overlay" onClick={onClose}>
      <div className="info-modal" onClick={(e) => e.stopPropagation()}>
        <div className="info-header">
          {onBack && (
            <button className="back-button" onClick={onBack}>
              ←
            </button>
          )}
          {onEdit && (
            <button 
              className="edit-button" 
              onClick={() => onEdit(exerciseName)}
              title="ערוך תרגיל"
            >
              ✏️
            </button>
          )}
          <h2>{title}</h2>
          <button className="info-close-btn" onClick={onClose}>
            ✕
          </button>
        </div>
        
        <div className="info-exercise-name">
          {getCustomExerciseTitle(exerciseName)}
        </div>

        <div className="info-content">
          {children}
        </div>
      </div>
    </div>
  );
};

export default ExerciseModal;
