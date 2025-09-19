import React from 'react';
import { getExerciseLastEntry, getDefaultWeight, getDefaultRepeats } from '../utils/exerciseHistory';

interface LastTrainingDetailsProps {
  exerciseName: string;
  onClose: () => void;
}

const LastTrainingDetails: React.FC<LastTrainingDetailsProps> = ({ exerciseName, onClose }) => {
  const lastEntry = getExerciseLastEntry(exerciseName);

  if (!lastEntry) {
    return (
      <div className="modal-overlay" onClick={onClose}>
        <div className="modal-content last-training-modal" onClick={(e) => e.stopPropagation()}>
          <div className="modal-header">
            <h2>אימון אחרון - {exerciseName}</h2>
            <button className="modal-close-btn" onClick={onClose}>×</button>
          </div>
          
          <div className="modal-body">
            <div className="no-data-message">
              <p>לא נמצא מידע על אימון קודם לתרגיל זה</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('he-IL', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content last-training-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>אימון אחרון - {exerciseName}</h2>
          <button className="modal-close-btn" onClick={onClose}>×</button>
        </div>
        
        <div className="modal-body">
          <div className="training-info-compact">
            <div className="info-column">
              <span className="info-label">תאריך</span>
              <span className="info-value">{formatDate(lastEntry.date)}</span>
            </div>
            <div className="info-column">
              <span className="info-label">זמן מנוחה</span>
              <span className="info-value">{formatTime(lastEntry.restTime)}</span>
            </div>
            <div className="info-column">
              <span className="info-label">סטים</span>
              <span className="info-value">{lastEntry.completedSets}/{lastEntry.totalSets}</span>
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
        </div>
      </div>
    </div>
  );
};

export default LastTrainingDetails;
