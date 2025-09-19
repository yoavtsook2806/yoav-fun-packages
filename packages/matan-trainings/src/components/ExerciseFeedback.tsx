import React, { useState } from 'react';
import { Exercise, SetData } from '../types';

interface ExerciseFeedbackProps {
  exerciseName: string;
  currentWeight?: number;
  currentRestTime: number;
  currentRepeats?: number;
  exercise: Exercise;
  completedSetsData?: SetData[];
  totalSets: number;
  onSave: (weight?: number, restTime?: number, repeats?: number) => void;
  onClose: () => void;
}

const ExerciseFeedback: React.FC<ExerciseFeedbackProps> = ({
  exerciseName,
  currentWeight,
  currentRestTime,
  currentRepeats,
  exercise,
  completedSetsData = [],
  totalSets,
  onSave,
  onClose,
}) => {
  const [weight, setWeight] = useState<string>(currentWeight?.toString() || '');
  const [restTime, setRestTime] = useState<string>(currentRestTime.toString());
  const [repeats, setRepeats] = useState<string>(currentRepeats?.toString() || '');

  // Check if user completed all sets as intended
  const checkIfTargetAchieved = (): boolean => {
    if (completedSetsData.length !== totalSets) return false;

    const targetWeight = currentWeight;
    const targetRepeats = currentRepeats;
    const minRepeats = exercise.minimumNumberOfRepeasts;

    return completedSetsData.every(setData => {
      const weightMatch = !targetWeight || !setData.weight || setData.weight >= targetWeight;
      const repeatsMatch = !targetRepeats || !setData.repeats || setData.repeats >= Math.max(targetRepeats, minRepeats);
      return weightMatch && repeatsMatch;
    });
  };

  const targetAchieved = checkIfTargetAchieved();

  const handleSave = () => {
    const weightValue = weight.trim() !== '' ? parseFloat(weight) : undefined;
    const restTimeValue = restTime.trim() !== '' ? parseInt(restTime) : undefined;
    const repeatsValue = repeats.trim() !== '' ? parseInt(repeats) : undefined;

    onSave(weightValue, restTimeValue, repeatsValue);
    onClose();
  };


  return (
    <div className="feedback-overlay" onClick={onClose}>
      <div className={`feedback-modal ${targetAchieved ? 'success' : 'needs-improvement'}`} onClick={(e) => e.stopPropagation()}>
        <div className="feedback-header">
          <div className={`feedback-status-icon ${targetAchieved ? 'success' : 'needs-improvement'}`}>
            {targetAchieved ? '🎯' : '🔄'}
          </div>
          <h2 className="feedback-title">איך היה?</h2>
          <div className="feedback-exercise-name">{exerciseName}</div>
        </div>

        <div className="feedback-content">
          <div className="sets-completion-display">
            <div className="completion-circle">
              <span className="completion-ratio">{completedSetsData.length}/{totalSets}</span>
              <span className="completion-label">סטים</span>
            </div>
            <div className="completion-percentage">
              {Math.round((completedSetsData.length / totalSets) * 100)}% הושלמו
            </div>
          </div>

          <div className={`feedback-message ${targetAchieved ? 'success' : 'needs-improvement'}`}>
            {targetAchieved ? (
              <div className="success-message">
                <h3>🎉 מעולה! השגת את המטרה שלך!</h3>
                <p>סיימת את כל הסטים ({completedSetsData.length}/{totalSets}) כפי שתכננת. זה הזמן להעלות רף!</p>
              </div>
            ) : (
              <div className="improvement-message">
                <h3>💪 כמעט שם! המשך לשפר</h3>
                <p>השלמת {completedSetsData.length} מתוך {totalSets} סטים לפי המטרה. אנחנו ממליצים לנסות את אותה מטרה או להוריד מעט בפעם הבאה.</p>
              </div>
            )}
          </div>

          <div className="feedback-subtitle">
            {targetAchieved ? 'הגדר מטרה חדשה לפעם הבאה:' : 'שנה את המטרה לפעם הבאה:'}
          </div>

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
              {targetAchieved && (
                <div className="suggestion">💡 נסה +2.5 ק"ג</div>
              )}
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
              {targetAchieved && (
                <div className="suggestion">💡 נסה +1-2 חזרות</div>
              )}
            </div>
          </div>
        </div>

        <div className="feedback-actions">
          <button className={`feedback-save-btn ${targetAchieved ? 'success' : 'improvement'}`} onClick={handleSave}>
            {targetAchieved ? '🚀 עדכן מטרה חדשה' : '🔄 שמור לניסיון הבא'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ExerciseFeedback;
