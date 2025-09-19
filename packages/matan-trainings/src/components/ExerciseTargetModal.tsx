import React, { useState } from 'react';
import { Exercise } from '../types';

interface ExerciseTargetModalProps {
  exerciseName: string;
  exercise: Exercise;
  currentWeight?: number;
  currentRestTime: number;
  currentRepeats?: number;
  showWarning?: boolean; // Show warning if user didn't complete target last time
  onConfirm: (weight?: number, restTime?: number, repeats?: number) => void;
  onClose: () => void;
}

const ExerciseTargetModal: React.FC<ExerciseTargetModalProps> = ({
  exerciseName,
  exercise,
  currentWeight,
  currentRestTime,
  currentRepeats,
  showWarning = false,
  onConfirm,
  onClose,
}) => {
  const [weight, setWeight] = useState<string>(currentWeight?.toString() || '');
  const [restTime, setRestTime] = useState<string>(currentRestTime.toString());
  const [repeats, setRepeats] = useState<string>(currentRepeats?.toString() || '');

  const handleConfirm = () => {
    const weightValue = weight.trim() !== '' ? parseFloat(weight) : undefined;
    const restTimeValue = restTime.trim() !== '' ? parseInt(restTime) : undefined;
    const repeatsValue = repeats.trim() !== '' ? parseInt(repeats) : undefined;

    onConfirm(weightValue, restTimeValue, repeatsValue);
    onClose();
  };

  const getRecommendedValues = () => {
    const minRepeats = exercise.minimumNumberOfRepeasts;
    const maxRepeats = exercise.maximumNumberOfRepeasts;
    const minRest = exercise.minimumTimeToRest;
    const maxRest = exercise.maximumTimeToRest;

    return {
      repeats: `${minRepeats}-${maxRepeats}`,
      restTime: `${minRest}-${maxRest} שניות`
    };
  };

  const recommended = getRecommendedValues();

  return (
    <div className="target-modal-overlay" onClick={onClose}>
      <div className="target-modal" onClick={(e) => e.stopPropagation()}>
        <div className="target-header">
          <div className="target-icon">🎯</div>
          <h2 className="target-title">הגדר מטרה לתרגיל</h2>
          <div className="target-exercise-name">{exerciseName}</div>
        </div>

        {showWarning && (
          <div className="target-warning">
            <div className="warning-icon">⚠️</div>
            <div className="warning-content">
              <h4>שים לב!</h4>
              <p>לא השגת את המטרה בפעם האחרונה. מומלץ לשנות את הערכים כדי להתאים לרמה שלך.</p>
            </div>
          </div>
        )}

        <div className="target-content">
          <div className="target-inputs-grid">
            <div className="target-input-box">
              <label className="target-label">
                משקל
                <span className="optional">(אופציונלי)</span>
              </label>
              <input
                type="text"
                inputMode="decimal"
                pattern="[0-9]*\.?[0-9]*"
                className="target-input"
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
                placeholder="ק״ג"
              />
              <div className="input-note">הכנס את המשקל שברצונך להשתמש בו</div>
            </div>

            <div className="target-input-box">
              <label className="target-label">זמן מנוחה</label>
              <input
                type="text"
                inputMode="decimal"
                pattern="[0-9]*\.?[0-9]*"
                className="target-input"
                value={restTime}
                onChange={(e) => setRestTime(e.target.value)}
                placeholder="שניות"
              />
              <div className="input-note">מומלץ: {recommended.restTime}</div>
            </div>

            <div className="target-input-box">
              <label className="target-label">
                חזרות
                <span className="optional">(אופציונלי)</span>
              </label>
              <input
                type="text"
                inputMode="decimal"
                pattern="[0-9]*\.?[0-9]*"
                className="target-input"
                value={repeats}
                onChange={(e) => setRepeats(e.target.value)}
                placeholder="מספר"
              />
              <div className="input-note">מומלץ: {recommended.repeats} חזרות</div>
            </div>
          </div>

          <div className="target-exercise-info">
            <h4>פרטי התרגיל:</h4>
            <div className="exercise-details">
              <div className="detail-item">
                <span className="detail-label">סטים:</span>
                <span className="detail-value">{exercise.numberOfSets}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">טווח חזרות:</span>
                <span className="detail-value">{recommended.repeats}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">טווח מנוחה:</span>
                <span className="detail-value">{recommended.restTime}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="target-actions">
          <button className="target-cancel-btn" onClick={onClose}>
            ביטול
          </button>
          <button className="target-confirm-btn" onClick={handleConfirm}>
            🚀 התחל תרגיל
          </button>
        </div>
      </div>
    </div>
  );
};

export default ExerciseTargetModal;