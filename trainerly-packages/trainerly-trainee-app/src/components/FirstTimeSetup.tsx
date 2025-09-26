import React, { useState } from 'react';
import { Trainings } from '../types';
import { getCustomExerciseTitle } from '../utils/exerciseHistory';
import { calculateDefaultRestTime, calculateDefaultRepeats } from '../utils/exerciseHistory';
import VideoModal from './VideoModal';

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
  const [isVideoModalOpen, setIsVideoModalOpen] = useState(false);

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
      setIsVideoModalOpen(true);
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


  return (
    <div className="info-overlay">
      <div className="info-modal setup-modal">
        <div className="info-header">
          <h2>הגדרה ראשונה</h2>
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
          <div className="exercise-title-container">
            {getCustomExerciseTitle(currentExerciseName)}
          </div>
          <div className="exercise-sets-info">
            {currentExercise.numberOfSets} סטים
          </div>
        </div>

        <div className="info-content">
          {/* Exercise description and video section */}
          {((currentExercise.note && currentExercise.note.trim() !== '') || (currentExercise.link && currentExercise.link.trim() !== '')) && (
            <div className="exercise-info-section">
              {currentExercise.note && currentExercise.note.trim() !== '' && (
                <div className="exercise-description">
                  <div className="exercise-description-text">{currentExercise.note}</div>
                </div>
              )}
              {currentExercise.link && currentExercise.link.trim() !== '' && (
                <div className="exercise-video">
                  <button
                    className="exercise-video-button"
                    onClick={handleVideoClick}
                    title="צפה בסרטון"
                  >
                    📹 צפה בסרטון
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Combined settings section */}
          <div className="setup-section">
            <div className="setup-section-title">ההגדרות שלי</div>
            <div className="setup-inputs">
              <div className="setup-input-item">
                <label className="setup-input-label">משקל (ק״ג)</label>
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
                <label className="setup-input-label">
                  חזרות ({currentExercise.minimumNumberOfRepeasts === currentExercise.maximumNumberOfRepeasts
                    ? currentExercise.minimumNumberOfRepeasts
                    : `${currentExercise.minimumNumberOfRepeasts}-${currentExercise.maximumNumberOfRepeasts}`})
                </label>
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
                <label className="setup-input-label">
                  מנוחה ({currentExercise.minimumTimeToRest === currentExercise.maximumTimeToRest
                    ? `${formatTime(currentExercise.minimumTimeToRest)}`
                    : `${formatTime(currentExercise.minimumTimeToRest)}-${formatTime(currentExercise.maximumTimeToRest)}`})
                </label>
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
        </div>

        <div className="setup-footer">
          <div className="setup-navigation">
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

        <VideoModal
          videoUrl={currentExercise.link || ''}
          isOpen={isVideoModalOpen}
          onClose={() => setIsVideoModalOpen(false)}
          exerciseName={currentExerciseName}
        />
      </div>
    </div>
  );
};

export default FirstTimeSetup;