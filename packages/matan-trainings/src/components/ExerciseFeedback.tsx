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

  const handleSkip = () => {
    onClose();
  };

  return (
    <div className="feedback-overlay" onClick={handleSkip}>
      <div className="feedback-modal" onClick={(e) => e.stopPropagation()}>
        <div className="feedback-header">
          <h2>איך היה?</h2>
        </div>
        
        <div className="feedback-exercise-name">{exerciseName}</div>
        
        <div className="feedback-content">
          <p>שמור הגדרות לפעם הבאה:</p>
          
          <div className="feedback-input-group">
            <label className="feedback-label">משקל (ק"ג):</label>
            <input
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              className="feedback-input"
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
              placeholder="הכנס משקל"
            />
          </div>
          
          <div className="feedback-input-group">
            <label className="feedback-label">זמן מנוחה (שניות):</label>
            <input
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              className="feedback-input"
              value={restTime}
              onChange={(e) => setRestTime(e.target.value)}
              placeholder="הכנס זמן מנוחה"
            />
          </div>
          
          <div className="feedback-input-group">
            <label className="feedback-label">חזרות:</label>
            <input
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              className="feedback-input"
              value={repeats}
              onChange={(e) => setRepeats(e.target.value)}
              placeholder="הכנס מספר חזרות"
            />
          </div>
        </div>
        
        <div className="feedback-actions">
          <button className="feedback-skip-btn" onClick={handleSkip}>
            דלג
          </button>
          <button className="feedback-save-btn" onClick={handleSave}>
            שמור
          </button>
        </div>
      </div>
    </div>
  );
};

export default ExerciseFeedback;
