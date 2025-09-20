import React from 'react';
import { Exercise } from '../types';
import ExerciseModal from './ExerciseModal';

interface ExerciseInfoProps {
  exerciseName: string;
  exercise: Exercise;
  onClose: () => void;
  onEdit?: (exerciseName: string) => void;
}

const ExerciseInfo: React.FC<ExerciseInfoProps> = ({
  exerciseName,
  exercise,
  onClose,
  onEdit,
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
    <ExerciseModal
      exerciseName={exerciseName}
      title="פרטי תרגיל"
      onClose={onClose}
      onEdit={onEdit}
    >
      {exercise.note && exercise.note.trim() !== '' && (
        <div className="info-description">
          <div className="info-description-text">{exercise.note}</div>
        </div>
      )}

      <div className="info-recommendations">
        <div className="info-recommendation-box">
          <div className="info-recommendation-label">סטים</div>
          <div className="info-recommendation-value">{exercise.numberOfSets}</div>
        </div>
        <div className="info-recommendation-box">
          <div className="info-recommendation-label">חזרות</div>
          <div className="info-recommendation-value">
            {exercise.minimumNumberOfRepeasts === exercise.maximumNumberOfRepeasts
              ? exercise.minimumNumberOfRepeasts
              : (
                <>
                  <span>{exercise.minimumNumberOfRepeasts}</span>
                  <span>-</span>
                  <span>{exercise.maximumNumberOfRepeasts}</span>
                </>
              )}
          </div>
        </div>
        <div className="info-recommendation-box">
          <div className="info-recommendation-label">מנוחה</div>
          <div className="info-recommendation-value">
            {exercise.minimumTimeToRest === exercise.maximumTimeToRest
              ? `${formatTime(exercise.minimumTimeToRest)}`
              : (
                <>
                  <span>{formatTime(exercise.minimumTimeToRest)}</span>
                  <span>-</span>
                  <span>{formatTime(exercise.maximumTimeToRest)}</span>
                </>
              )}
          </div>
        </div>
      </div>

      {exercise.link && exercise.link.trim() !== '' && (
        <div className="info-footer">
          <button
            className="setup-nav-btn setup-video-btn"
            onClick={handleVideoClick}
          >
            📹 צפה בסרטון
          </button>
        </div>
      )}
    </ExerciseModal>
  );
};

export default ExerciseInfo;
