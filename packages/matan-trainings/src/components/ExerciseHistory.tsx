import React, { useState } from 'react';
import { getExerciseHistory, getDefaultWeight, getDefaultRepeats } from '../utils/exerciseHistory';
import { ExerciseHistoryEntry } from '../types';
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
  const [selectedEntry, setSelectedEntry] = useState<ExerciseHistoryEntry | null>(null);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('he-IL', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('he-IL', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatRestTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };


  const handleBackToList = () => {
    setSelectedEntry(null);
  };

  const handleEntryClick = (entry: ExerciseHistoryEntry) => {
    setSelectedEntry(entry);
  };

  // Detailed view for selected entry
  if (selectedEntry) {
    return (
      <ExerciseModal
        exerciseName={exerciseName}
        title="פרטי אימון"
        onClose={onClose}
        onBack={handleBackToList}
      >
        <div className="detailed-history-view">
          <div className="detailed-date">
            {formatDateTime(selectedEntry.date)}
          </div>

          <div className="workout-summary">
            {selectedEntry.setsData && selectedEntry.setsData.length > 0 && (() => {
              const firstSet = selectedEntry.setsData[0];
              const targetWeight = firstSet?.weight || selectedEntry.weight;
              const targetRepeats = firstSet?.repeats || selectedEntry.repeats;
              
              const successfulSets = selectedEntry.setsData.filter(setData => {
                const weightSuccess = !targetWeight || !setData.weight || setData.weight >= targetWeight;
                const repeatsSuccess = !targetRepeats || !setData.repeats || setData.repeats >= targetRepeats;
                return weightSuccess && repeatsSuccess;
              }).length;
              
              return (
                <div className="summary-item">
                  <span className="summary-label">סטים מוצלחים:</span>
                  <span className={`summary-value ${successfulSets === selectedEntry.completedSets ? 'success' : 'warning'}`}>
                    {successfulSets}/{selectedEntry.completedSets}
                  </span>
                </div>
              );
            })()}
            <div className="summary-item">
              <span className="summary-label">זמן מנוחה:</span>
              <span className="summary-value">{formatRestTime(selectedEntry.restTime)}</span>
            </div>
          </div>

          {selectedEntry.setsData && selectedEntry.setsData.length > 0 ? (
            <div className="sets-details">
              <h4>פירוט סטים:</h4>
              <div className="sets-grid">
                {selectedEntry.setsData.map((setData, index) => {
                  // Get the target values from the first set of this specific workout
                  const firstSet = selectedEntry.setsData[0];
                  const targetWeight = firstSet?.weight || selectedEntry.weight;
                  const targetRepeats = firstSet?.repeats || selectedEntry.repeats;

                  // Check if this set met the targets
                  const weightSuccess = !targetWeight || !setData.weight || setData.weight >= targetWeight;
                  const repeatsSuccess = !targetRepeats || !setData.repeats || setData.repeats >= targetRepeats;
                  const setSuccess = weightSuccess && repeatsSuccess;

                  return (
                    <div key={index} className={`set-card ${setSuccess ? 'set-success' : 'set-incomplete'}`}>
                      <div className="set-header">
                        <div className="set-number">סט {index + 1}</div>
                        <div className={`set-status-indicator ${setSuccess ? 'success' : 'incomplete'}`}>
                          {setSuccess ? '✅' : '⚠️'}
                        </div>
                      </div>
                      <div className="set-data">
                        {setData.weight && (
                          <div className={`data-item ${weightSuccess ? 'success' : 'incomplete'}`}>
                            <span className="data-label">משקל:</span>
                            <span className="data-value">{setData.weight} ק"ג</span>
                            {targetWeight && (
                              <span className="target-comparison">
                                ({targetWeight} ק"ג מטרה)
                              </span>
                            )}
                          </div>
                        )}
                        {setData.repeats && (
                          <div className={`data-item ${repeatsSuccess ? 'success' : 'incomplete'}`}>
                            <span className="data-label">חזרות:</span>
                            <span className="data-value">{setData.repeats}</span>
                            {targetRepeats && (
                              <span className="target-comparison">
                                ({targetRepeats} מטרה)
                              </span>
                            )}
                          </div>
                        )}
                        {!setData.weight && !setData.repeats && (
                          <div className="data-item no-data">
                            <span className="data-value">אין נתונים</span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="no-sets-data">
              <p>אין פירוט סטים זמין (אימון ישן)</p>
              {selectedEntry.weight && (
                <div className="legacy-data">
                  <span>משקל: {selectedEntry.weight} ק"ג</span>
                </div>
              )}
              {selectedEntry.repeats && (
                <div className="legacy-data">
                  <span>חזרות: {selectedEntry.repeats}</span>
                </div>
              )}
            </div>
          )}
        </div>
      </ExerciseModal>
    );
  }

  // Main list view
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
            <div 
              key={index} 
              className="history-entry clickable-date"
              onClick={() => handleEntryClick(entry)}
              title="לחץ לפירוט מלא של האימון"
            >
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
    </ExerciseModal>
  );
};

export default ExerciseHistory;
