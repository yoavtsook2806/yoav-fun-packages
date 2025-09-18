import React, { useState } from 'react';

interface ExerciseFeedbackProps {
  exerciseName: string;
  currentWeight?: number;
  currentRestTime: number;
  currentRepeats?: number;
  onSave: (weight?: number, restTime?: number, repeats?: number) => void;
  onClose: () => void;
}

const ExerciseFeedback: React.FC<ExerciseFeedbackProps> = ({
  exerciseName,
  currentWeight,
  currentRestTime,
  currentRepeats,
  onSave,
  onClose,
}) => {
  const [weight, setWeight] = useState<string>(currentWeight?.toString() || '');
  const [restTime, setRestTime] = useState<string>(currentRestTime.toString());
  const [repeats, setRepeats] = useState<string>(currentRepeats?.toString() || '');

  const handleSave = () => {
    const weightValue = weight.trim() !== '' ? parseFloat(weight) : undefined;
    const restTimeValue = restTime.trim() !== '' ? parseInt(restTime) : undefined;
    const repeatsValue = repeats.trim() !== '' ? parseInt(repeats) : undefined;
    
    onSave(weightValue, restTimeValue, repeatsValue);
    onClose();
  };


  return (
    <div className="feedback-overlay" onClick={onClose}>
      <div className="feedback-modal" onClick={(e) => e.stopPropagation()}>
        <div className="feedback-header">
          <h2>איך היה?</h2>
        </div>

        <div className="feedback-exercise-name">{exerciseName}</div>

        <div className="feedback-content">
          <div className="feedback-subtitle">שמור הגדרות לפעם הבאה:</div>

          <div className="feedback-inputs-grid">
            <div className="feedback-input-box">
              <label className="feedback-label">משקל</label>
              <input
                type="text"
                inputMode="decimal"
                pattern="[0-9]*\.?[0-9]*"
                className="feedback-input"
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
                placeholder="ק״ג"
              />
            </div>

            <div className="feedback-input-box">
              <label className="feedback-label">זמן מנוחה</label>
              <input
                type="text"
                inputMode="decimal"
                pattern="[0-9]*\.?[0-9]*"
                className="feedback-input"
                value={restTime}
                onChange={(e) => setRestTime(e.target.value)}
                placeholder="שניות"
              />
            </div>

            <div className="feedback-input-box">
              <label className="feedback-label">חזרות</label>
              <input
                type="text"
                inputMode="decimal"
                pattern="[0-9]*\.?[0-9]*"
                className="feedback-input"
                value={repeats}
                onChange={(e) => setRepeats(e.target.value)}
                placeholder="מספר"
              />
            </div>
          </div>
        </div>

        <div className="feedback-actions">
          <button className="feedback-save-btn" onClick={handleSave}>
            שמור לפעם הבאה
          </button>
        </div>
      </div>
    </div>
  );
};

export default ExerciseFeedback;
