import React from 'react';
import { ExerciseHistoryEntry } from '../types';
import { getExerciseHistory } from '../utils/exerciseHistory';

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
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatRestTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="history-overlay">
      <div className="history-modal">
        <div className="history-header">
          <h2>היסטוריית תרגיל</h2>
          <button className="close-button" onClick={onClose}>
            ✕
          </button>
        </div>
        
        <div className="history-exercise-name">
          {exerciseName}
        </div>

        <div className="history-content">
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
                <div className="history-col">סטים</div>
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
                    {entry.completedSets}/{entry.totalSets}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="history-footer">
          <button className="green-button" onClick={onClose}>
            סגור
          </button>
        </div>
      </div>
    </div>
  );
};

export default ExerciseHistory;
