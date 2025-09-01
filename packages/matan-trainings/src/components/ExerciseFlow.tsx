import React, { useState, useEffect } from 'react';
import { TrainingState, ExerciseState, Trainings } from '../types';

interface ExerciseFlowProps {
  trainingState: TrainingState;
  trainings: Trainings;
  onUpdateExerciseState: (exerciseName: string, updates: Partial<ExerciseState>) => void;
  onGoToExercise: (exerciseIndex: number) => void;
  onNextExercise: () => void;
  onResetTraining: () => void;
}

const ExerciseFlow: React.FC<ExerciseFlowProps> = ({
  trainingState,
  trainings,
  onUpdateExerciseState,
  onGoToExercise,
  onNextExercise,
  onResetTraining,
}) => {
  const [timerId, setTimerId] = useState<NodeJS.Timeout | null>(null);

  // Helper function to create short exercise names
  const getShortExerciseName = (exerciseName: string): string => {
    const exerciseMap: { [key: string]: string } = {
      "לחיצת חזה, מ. יד, שיפוע 30*": "חזה",
      "פרפר, מ. יד/מכונה": "פרפר", 
      "לחיצת רגליים": "רגליים",
      "פשיטת מרפק, פולי עליון, חבל": "טריצפס",
      "AB ROLLOUT": "בטן",
      "משיכה בפולי עליון, ניטרלי": "משיכה",
      "חתירה בכבל, רחב": "חתירה",
      "הרחקות אופקיות, שיפוע 30*, מ. יד": "הרחקות",
      "כפיפת מרפק בשיפוע 60*, סופינציה": "ביצפס",
      "תאומים (לחיצת רגליים/סמית' משין)": "תאומים",
      "לחיצת כתפיים בישיבה, מ. יד": "כתפיים",
      "הרחקת כתפיים בשיפוע 60*, מ. יד, בשכיבה על החזה": "הרחקות כתף",
      "חתירה במכונה": "חתירה מכונה",
      "כפיפת ברכיים בישיבה": "ברכיים",
      "כפיפות בטן, רגליים מקובעות": "בטן"
    };
    
    return exerciseMap[exerciseName] || exerciseName.split(' ')[0];
  };

  const currentExerciseName = trainingState.exercises[trainingState.currentExerciseIndex];
  const currentExercise = trainings[trainingState.selectedTraining!][currentExerciseName];
  const currentExerciseState = trainingState.exerciseStates[currentExerciseName];

  // Timer effect
  useEffect(() => {
    if (currentExerciseState?.isResting && currentExerciseState.timeLeft > 0) {
      const id = setInterval(() => {
        onUpdateExerciseState(currentExerciseName, {
          timeLeft: Math.max(0, currentExerciseState.timeLeft - 1),
        });
      }, 1000);
      setTimerId(id);

      return () => {
        clearInterval(id);
        setTimerId(null);
      };
    } else if (timerId) {
      clearInterval(timerId);
      setTimerId(null);
    }
  }, [currentExerciseState?.isResting, currentExerciseState?.timeLeft, currentExerciseName, onUpdateExerciseState]);

  // Auto-enable finish set button when timer finishes
  useEffect(() => {
    if (currentExerciseState?.isResting && currentExerciseState.timeLeft === 0) {
      onUpdateExerciseState(currentExerciseName, {
        isResting: false,
      });
    }
  }, [currentExerciseState?.timeLeft, currentExerciseState?.isResting, currentExerciseName, onUpdateExerciseState]);

  const startExercise = () => {
    onUpdateExerciseState(currentExerciseName, {
      isActive: true,
    });
  };

  const finishSet = () => {
    const newSetCount = currentExerciseState.currentSet + 1;
    const isExerciseComplete = newSetCount >= currentExercise.numberOfSets;

    if (isExerciseComplete) {
      onUpdateExerciseState(currentExerciseName, {
        currentSet: newSetCount,
        completed: true,
        isActive: false,
        isResting: false,
      });
    } else {
      const restTime = currentExerciseState.customRestTime || trainingState.restTime;
      onUpdateExerciseState(currentExerciseName, {
        currentSet: newSetCount,
        isResting: true,
        timeLeft: restTime,
      });
    }
  };

  const updateCustomRestTime = (newRestTime: number) => {
    onUpdateExerciseState(currentExerciseName, {
      customRestTime: newRestTime,
    });
  };



  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (!currentExerciseName) {
    return <div>טוען...</div>;
  }

  return (
    <div className="exercise-flow-container">
      {/* Header */}
      <div className="exercise-header">
        <h2>אימון {trainingState.selectedTraining}</h2>
        <button 
          className="back-arrow-button" 
          onClick={onResetTraining}
          style={{ 
            position: 'absolute', 
            top: '20px', 
            left: '20px', 
            padding: '10px', 
            background: '#2a2a2a',
            border: '1px solid #555',
            borderRadius: '6px',
            color: '#ffffff',
            cursor: 'pointer',
            fontSize: '18px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '40px',
            height: '40px'
          }}
          title="חזור להתחלה"
        >
          ←
        </button>
        
        {/* Rest Time Setting - Top Right */}
        <div className="header-rest-time">
          <div className="rest-time-label">זמן מנוחה</div>
          <input
            type="number"
            value={currentExerciseState?.customRestTime || trainingState.restTime}
            onChange={(e) => updateCustomRestTime(Number(e.target.value))}
            min="10"
            max="300"
            className="rest-time-input"
          />
        </div>
      </div>

      <div className="exercise-layout">
        {/* Side Panel */}
        <div className="exercise-sidebar">
          <div className="exercise-row">
            {trainingState.exercises.map((exerciseName, index) => {
              const exerciseState = trainingState.exerciseStates[exerciseName];
              const exercise = trainings[trainingState.selectedTraining!][exerciseName];
              let className = 'exercise-row-item';
              
              if (exerciseState.completed) {
                className += ' completed';
              } else if (index === trainingState.currentExerciseIndex) {
                className += ' current';
              }

              const shortName = getShortExerciseName(exerciseName);

              return (
                <div
                  key={exerciseName}
                  className={className}
                  onClick={() => onGoToExercise(index)}
                  title={exerciseName} // Show full name on hover
                >
                  <div className="exercise-row-number">{index + 1}</div>
                  <div className="exercise-row-name">{shortName}</div>
                  <div className="exercise-row-sets">
                    {exerciseState.currentSet}/{exercise.numberOfSets}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Main Content */}
        <div className="exercise-main">
          <div className="exercise-name">{currentExerciseName}</div>

          {/* Sets Progress with Visual Slider */}
          <div className="sets-progress-container">
            <div className="sets-counter">
              {currentExerciseState.currentSet}/{currentExercise.numberOfSets} סטים
            </div>
            <div className="sets-progress-bar">
              <div 
                className="sets-progress-fill" 
                style={{ width: `${(currentExerciseState.currentSet / currentExercise.numberOfSets) * 100}%` }}
              />
              <div className="sets-markers">
                {Array.from({ length: currentExercise.numberOfSets }, (_, i) => (
                  <div 
                    key={i} 
                    className={`set-marker ${i < currentExerciseState.currentSet ? 'completed' : ''}`}
                    style={{ left: `${((i + 0.5) / currentExercise.numberOfSets) * 100}%` }}
                  >
                    {i + 1}
                  </div>
                ))}
              </div>
            </div>
          </div>



          {/* Timer */}
          {currentExerciseState.isResting && (
            <div className={`timer ${currentExerciseState.timeLeft === 0 ? 'finished' : ''}`}>
              {currentExerciseState.timeLeft === 0 ? 'זמן!' : formatTime(currentExerciseState.timeLeft)}
            </div>
          )}

          {/* Action Buttons */}
          <div className="exercise-actions">
            {!currentExerciseState.isActive && !currentExerciseState.completed && (
              <button
                className="green-button"
                onClick={startExercise}
                style={{ padding: '15px 30px', fontSize: '18px' }}
              >
                התחל תרגיל
              </button>
            )}

            {currentExerciseState.isActive && !currentExerciseState.completed && !(currentExerciseState.isResting && currentExerciseState.timeLeft > 0) && (
              <button
                className="green-button"
                onClick={finishSet}
                style={{ padding: '15px 30px', fontSize: '18px' }}
              >
                סיים סט
              </button>
            )}

            {currentExerciseState.completed && (
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '24px', color: '#4CAF50', marginBottom: '20px' }}>
                  ✅ תרגיל הושלם!
                </div>
                <button
                  className="green-button"
                  onClick={onNextExercise}
                  style={{ padding: '15px 30px', fontSize: '18px' }}
                >
                  המשך לתרגיל הבא
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExerciseFlow;
