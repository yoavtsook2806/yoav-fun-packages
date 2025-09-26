import React from 'react';
import { ExerciseHistoryEntry } from '../types';
import ExerciseModal from './ExerciseModal';

interface TrainingDetailedProps {
  exerciseName: string;
  trainingEntry: ExerciseHistoryEntry;
  onClose: () => void;
}

const TrainingDetailed: React.FC<TrainingDetailedProps> = ({ exerciseName, trainingEntry, onClose }) => {
  if (!trainingEntry) {
    return (
      <ExerciseModal
        exerciseName={exerciseName}
        title="פרטי אימון"
        onClose={onClose}
      >
        <div className="no-data-message">
          <p>לא נמצא מידע על האימון</p>
        </div>
      </ExerciseModal>
    );
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('he-IL', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <ExerciseModal
      exerciseName={exerciseName}
      title="פרטי אימון"
      onClose={onClose}
    >
      <div className="info-recommendations">
        <div className="info-recommendation-box">
          <div className="info-recommendation-label">תאריך</div>
          <div className="info-recommendation-value">{formatDate(trainingEntry.date)}</div>
        </div>
        <div className="info-recommendation-box">
          <div className="info-recommendation-label">מנוחה</div>
          <div className="info-recommendation-value">{formatTime(trainingEntry.restTime)}</div>
        </div>
        {trainingEntry.setsData && trainingEntry.setsData.length > 0 && (() => {
          const firstSet = trainingEntry.setsData[0];
          const targetWeight = firstSet?.weight || trainingEntry.weight;
          const targetRepeats = firstSet?.repeats || trainingEntry.repeats;
          
          const successfulSets = trainingEntry.setsData.filter(setData => {
            const weightSuccess = !targetWeight || !setData.weight || setData.weight >= targetWeight;
            const repeatsSuccess = !targetRepeats || !setData.repeats || setData.repeats >= targetRepeats;
            return weightSuccess && repeatsSuccess;
          }).length;
          
          return (
            <div className="info-recommendation-box">
              <div className="info-recommendation-label">סטים מוצלחים</div>
              <div className={`info-recommendation-value ${successfulSets === trainingEntry.completedSets ? 'success' : 'warning'}`}>
                {successfulSets}/{trainingEntry.completedSets}
              </div>
            </div>
          );
        })()}
      </div>

      <div className="sets-details">
        <h3>פירוט סטים</h3>
        {trainingEntry.setsData && trainingEntry.setsData.length > 0 ? (
          <div className="sets-grid">
            {trainingEntry.setsData.map((setData, index) => {
              // Get the target values from the first set of this specific workout
              const firstSet = trainingEntry.setsData?.[0];
              const targetWeight = firstSet?.weight || trainingEntry.weight;
              const targetRepeats = firstSet?.repeats || trainingEntry.repeats;

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
        ) : (
          <div className="no-sets-data">
            <p>אין פירוט סטים זמין (אימון ישן)</p>
            {trainingEntry.weight && (
              <div className="legacy-data">
                <span>משקל: {trainingEntry.weight} ק"ג</span>
              </div>
            )}
            {trainingEntry.repeats && (
              <div className="legacy-data">
                <span>חזרות: {trainingEntry.repeats}</span>
              </div>
            )}
          </div>
        )}
      </div>
    </ExerciseModal>
  );
};

export default TrainingDetailed;
