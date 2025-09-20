import React from 'react';
import { getExerciseHistory } from '../utils/exerciseHistory';
import ExerciseModal from './ExerciseModal';

interface ExerciseHistoryProps {
  exerciseName: string;
  onClose: () => void;
}

const ExerciseHistory: React.FC<ExerciseHistoryProps> = ({
  exerciseName,
  onClose,
}) => {
  const history = getExerciseHistory();
  const exerciseHistory = history[exerciseName] || [];

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('he-IL', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
  };

  const formatRestTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <ExerciseModal
      exerciseName={exerciseName}
      title="היסטוריית תרגיל"
      onClose={onClose}
    >
      {exerciseHistory.length === 0 ? (
        <div className="no-history">
          <p>אין היסטוריה עדיין לתרגיל זה</p>
          <p>השלם את התרגיל כדי לראות את ההיסטוריה כאן</p>
        </div>
      ) : (
        <div className="history-list">
          <div className="history-list-header">
            <div className="history-col">תאריך</div>
            <div className="history-col">משקל</div>
            <div className="history-col">מנוחה</div>
            <div className="history-col">חזרות</div>
          </div>
          
          {exerciseHistory.map((entry, index) => (
            <div key={index} className="history-entry">
              <div className="history-col">
                {formatDate(entry.date)}
              </div>
              <div className="history-col">
                {entry.weight ? `${entry.weight} ק"ג` : '-'}
              </div>
              <div className="history-col">
                {formatRestTime(entry.restTime)}
              </div>
              <div className="history-col">
                {entry.repeats ? entry.repeats : '-'}
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="info-footer">
        <button className="setup-nav-btn setup-video-btn" onClick={onClose}>
          סגור
        </button>
      </div>
    </ExerciseModal>
  );
};

export default ExerciseHistory;
