import React from 'react';
import { getExerciseLastEntry, getDefaultWeight, getDefaultRepeats } from '../utils/exerciseHistory';
import ExerciseModal from './ExerciseModal';

interface LastTrainingDetailsProps {
  exerciseName: string;
  onClose: () => void;
}

const LastTrainingDetails: React.FC<LastTrainingDetailsProps> = ({ exerciseName, onClose }) => {
  const lastEntry = getExerciseLastEntry(exerciseName);

  if (!lastEntry) {
    return (
      <ExerciseModal
        exerciseName={exerciseName}
        title="אימון אחרון"
        onClose={onClose}
      >
        <div className="no-data-message">
          <p>לא נמצא מידע על אימון קודם לתרגיל זה</p>
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
      title="אימון אחרון"
      onClose={onClose}
    >
      <div className="info-recommendations">
        <div className="info-recommendation-box">
          <div className="info-recommendation-label">תאריך</div>
          <div className="info-recommendation-value">{formatDate(lastEntry.date)}</div>
        </div>
        <div className="info-recommendation-box">
          <div className="info-recommendation-label">מנוחה</div>
          <div className="info-recommendation-value">{formatTime(lastEntry.restTime)}</div>
        </div>
        <div className="info-recommendation-box">
          <div className="info-recommendation-label">סטים</div>
          <div className="info-recommendation-value">{lastEntry.completedSets}/{lastEntry.totalSets}</div>
        </div>
      </div>

      <div className="sets-details">
        <h3>פירוט סטים</h3>
        {lastEntry.setsData && lastEntry.setsData.length > 0 ? (
          <div className="sets-grid">
            {lastEntry.setsData.map((setData, index) => {
              // Get the target values that were used for this training
              const targetWeight = getDefaultWeight(exerciseName) || lastEntry.weight;
              const targetRepeats = getDefaultRepeats(exerciseName) || lastEntry.repeats;

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
            {lastEntry.weight && (
              <div className="legacy-data">
                <span>משקל: {lastEntry.weight} ק"ג</span>
              </div>
            )}
            {lastEntry.repeats && (
              <div className="legacy-data">
                <span>חזרות: {lastEntry.repeats}</span>
              </div>
            )}
          </div>
        )}
      </div>
    </ExerciseModal>
  );
};

export default LastTrainingDetails;
