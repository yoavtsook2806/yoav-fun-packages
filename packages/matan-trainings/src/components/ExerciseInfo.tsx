import React from 'react';
import { Exercise } from '../types';

interface ExerciseInfoProps {
  exerciseName: string;
  exercise: Exercise;
  onClose: () => void;
}

const ExerciseInfo: React.FC<ExerciseInfoProps> = ({
  exerciseName,
  exercise,
  onClose,
}) => {
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleVideoClick = () => {
    if (exercise.link && exercise.link.trim() !== '') {
      window.open(exercise.link, '_blank');
    }
  };

  return (
    <div className="info-overlay">
      <div className="info-modal">
        <div className="info-header">
          <h2>פרטי תרגיל</h2>
          <button className="close-button" onClick={onClose}>
            ✕
          </button>
        </div>
        
        <div className="info-exercise-name">
          {exerciseName}
        </div>

        {exercise.note && exercise.note.trim() !== '' && (
          <div className="info-description">
            <div className="info-description-text">{exercise.note}</div>
          </div>
        )}

        <div className="info-content">
          <div className="info-section">
            <div className="info-row">
              <div className="info-label">מספר סטים:</div>
              <div className="info-value">{exercise.numberOfSets}</div>
            </div>
            
            <div className="info-row">
              <div className="info-label">טווח חזרות:</div>
              <div className="info-value">
                {exercise.minimumNumberOfRepeasts === exercise.maximumNumberOfRepeasts 
                  ? exercise.minimumNumberOfRepeasts 
                  : `${exercise.minimumNumberOfRepeasts}-${exercise.maximumNumberOfRepeasts}`}
              </div>
            </div>
            
            <div className="info-row">
              <div className="info-label">זמן מנוחה:</div>
              <div className="info-value">
                {exercise.minimumTimeToRest === exercise.maximumTimeToRest 
                  ? `${formatTime(exercise.minimumTimeToRest)}` 
                  : `${formatTime(exercise.minimumTimeToRest)}-${formatTime(exercise.maximumTimeToRest)}`}
              </div>
            </div>
          </div>
        </div>

        <div className="info-footer">
          {exercise.link && exercise.link.trim() !== '' && (
            <button 
              className="green-button"
              onClick={handleVideoClick}
              style={{ marginLeft: '10px' }}
            >
              📹 צפה בסרטון
            </button>
          )}
          <button className="info-close-btn" onClick={onClose}>
            סגור
          </button>
        </div>
      </div>
    </div>
  );
};

export default ExerciseInfo;
