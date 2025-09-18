import React, { useState } from 'react';
import { Trainings } from '../types';
import { getCustomExerciseTitle } from '../utils/exerciseHistory';
import { calculateDefaultRestTime, calculateDefaultRepeats } from '../utils/exerciseHistory';

interface FirstTimeSetupProps {
  trainingType: string;
  exercises: string[];
  trainings: Trainings;
  onComplete: (exerciseDefaults: { [exerciseName: string]: { weight?: number; repeats?: number; timeToRest?: number } }) => void;
  onCancel: () => void;
}

interface ExerciseDefaults {
  weight?: number;
  repeats?: number;
  timeToRest?: number;
}

const FirstTimeSetup: React.FC<FirstTimeSetupProps> = ({
  trainingType,
  exercises,
  trainings,
  onComplete,
  onCancel,
}) => {
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
  const [exerciseDefaults, setExerciseDefaults] = useState<{ [exerciseName: string]: ExerciseDefaults }>({});

  const currentExerciseName = exercises[currentExerciseIndex];
  const currentExercise = trainings[trainingType][currentExerciseName];

  const currentDefaults = exerciseDefaults[currentExerciseName] || {};

  const isLastExercise = currentExerciseIndex === exercises.length - 1;
  const hasFilledAnyField = currentDefaults.weight !== undefined ||
                           currentDefaults.repeats !== undefined ||
                           currentDefaults.timeToRest !== undefined;

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleVideoClick = () => {
    if (currentExercise.link && currentExercise.link.trim() !== '') {
      window.open(currentExercise.link, '_blank');
    }
  };

  const updateExerciseDefault = (field: keyof ExerciseDefaults, value: number | undefined) => {
    setExerciseDefaults(prev => ({
      ...prev,
      [currentExerciseName]: {
        ...prev[currentExerciseName],
        [field]: value && value > 0 ? value : undefined,
      },
    }));
  };

  const handleNext = () => {
    if (isLastExercise) {
      onComplete(exerciseDefaults);
    } else {
      setCurrentExerciseIndex(prev => prev + 1);
    }
  };

  const handlePrevious = () => {
    if (currentExerciseIndex > 0) {
      setCurrentExerciseIndex(prev => prev - 1);
    }
  };

  return (
    <div className="info-overlay">
      <div className="info-modal" style={{ maxWidth: '600px' }}>
        <div className="info-header">
          <h2>הגדרת אימון ראשונה</h2>
          <button className="close-button" onClick={onCancel}>
            ✕
          </button>
        </div>

        <div className="setup-progress">
          <div className="progress-text">
            תרגיל {currentExerciseIndex + 1} מתוך {exercises.length}
          </div>
          <div className="progress-bar">
            <div
              className="progress-fill"
              style={{ width: `${((currentExerciseIndex + 1) / exercises.length) * 100}%` }}
            />
          </div>
        </div>

        <div className="info-exercise-name">
          {getCustomExerciseTitle(currentExerciseName)}
        </div>

        {currentExercise.note && currentExercise.note.trim() !== '' && (
          <div className="info-description">
            <div className="info-description-text">{currentExercise.note}</div>
          </div>
        )}

        <div className="info-content">
          {/* Exercise recommendations line */}
          <div className="setup-recommendations">
            <div className="setup-recommendation-item">
              <div className="setup-recommendation-label">סטים</div>
              <div className="setup-recommendation-value">{currentExercise.numberOfSets}</div>
            </div>
            <div className="setup-recommendation-item">
              <div className="setup-recommendation-label">חזרות</div>
              <div className="setup-recommendation-value">
                {currentExercise.minimumNumberOfRepeasts === currentExercise.maximumNumberOfRepeasts
                  ? currentExercise.minimumNumberOfRepeasts
                  : `${currentExercise.minimumNumberOfRepeasts}-${currentExercise.maximumNumberOfRepeasts}`}
              </div>
            </div>
            <div className="setup-recommendation-item">
              <div className="setup-recommendation-label">מנוחה</div>
              <div className="setup-recommendation-value">
                {currentExercise.minimumTimeToRest === currentExercise.maximumTimeToRest
                  ? `${formatTime(currentExercise.minimumTimeToRest)}`
                  : `${formatTime(currentExercise.minimumTimeToRest)}-${formatTime(currentExercise.maximumTimeToRest)}`}
              </div>
            </div>
          </div>

          {/* Video line */}
          {currentExercise.link && currentExercise.link.trim() !== '' && (
            <div className="setup-video-section">
              <button
                className="setup-video-btn"
                onClick={handleVideoClick}
              >
                📹 צפה בסרטון הדגמה
              </button>
            </div>
          )}

          {/* User inputs line */}
          <div className="setup-inputs">
            <div className="setup-input-item">
              <label className="setup-input-label">משקל</label>
              <input
                type="number"
                inputMode="decimal"
                pattern="[0-9]*\.?[0-9]*"
                value={currentDefaults.weight || ''}
                onChange={(e) => updateExerciseDefault('weight', Number(e.target.value))}
                placeholder="ק״ג"
                min="0"
                max="500"
                step="0.5"
                className="setup-input-field"
              />
            </div>

            <div className="setup-input-item">
              <label className="setup-input-label">חזרות</label>
              <input
                type="number"
                inputMode="decimal"
                pattern="[0-9]*\.?[0-9]*"
                value={currentDefaults.repeats || ''}
                onChange={(e) => updateExerciseDefault('repeats', Number(e.target.value))}
                placeholder={`${calculateDefaultRepeats(currentExercise)}`}
                min="1"
                max="50"
                step="1"
                className="setup-input-field"
              />
            </div>

            <div className="setup-input-item">
              <label className="setup-input-label">מנוחה</label>
              <input
                type="number"
                inputMode="decimal"
                pattern="[0-9]*\.?[0-9]*"
                value={currentDefaults.timeToRest || ''}
                onChange={(e) => updateExerciseDefault('timeToRest', Number(e.target.value))}
                placeholder={`${calculateDefaultRestTime(currentExercise)}`}
                min="10"
                max="300"
                step="5"
                className="setup-input-field"
              />
            </div>
          </div>
        </div>

        <div className="setup-footer">
          <div className="setup-navigation">
            <button
              className="setup-nav-btn setup-back-btn"
              onClick={handlePrevious}
              disabled={currentExerciseIndex === 0}
              style={{
                opacity: currentExerciseIndex === 0 ? 0.5 : 1,
                cursor: currentExerciseIndex === 0 ? 'not-allowed' : 'pointer'
              }}
            >
              קודם
            </button>

            <button
              className={`setup-nav-btn ${isLastExercise ? 'setup-start-btn' : 'setup-next-btn'}`}
              onClick={handleNext}
              disabled={!hasFilledAnyField}
              style={{
                opacity: hasFilledAnyField ? 1 : 0.5,
                cursor: hasFilledAnyField ? 'pointer' : 'not-allowed'
              }}
            >
              {isLastExercise ? 'התחל אימון' : 'הבא'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FirstTimeSetup;