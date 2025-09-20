import React, { useState, useEffect } from 'react';
import { TrainingState, ExerciseState, Trainings } from '../types';
import ExerciseHistory from './ExerciseHistory';
import ExerciseFeedback from './ExerciseFeedback';
import ExerciseInfo from './ExerciseInfo';
import ExerciseEdit from './ExerciseEdit';
import LastTrainingDetails from './LastTrainingDetails';
import { saveExerciseDefaults, saveCustomExerciseData, getCustomExerciseTitle, getCustomExerciseNote, getDefaultWeight, getDefaultRepeats, getDefaultRestTime } from '../utils/exerciseHistory';

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
  const [historyModal, setHistoryModal] = useState<string | null>(null);
  const [feedbackModal, setFeedbackModal] = useState<string | null>(null);
  const [infoModal, setInfoModal] = useState<string | null>(null);
  const [editModal, setEditModal] = useState<string | null>(null);
  const [lastTrainingModal, setLastTrainingModal] = useState<string | null>(null);


  const currentExerciseName = trainingState.exercises[trainingState.currentExerciseIndex];
  const currentExercise = trainings[trainingState.selectedTraining!][currentExerciseName];
  const currentExerciseState = trainingState.exerciseStates[currentExerciseName];

  // Timer effect - uses startTimestamp for accurate timing
  useEffect(() => {
    if (currentExerciseState?.isResting && currentExerciseState.startTimestamp && currentExerciseState.restDuration) {
      const id = setInterval(() => {
        const now = Date.now();
        const elapsed = Math.floor((now - currentExerciseState.startTimestamp!) / 1000);
        const newTimeLeft = Math.max(0, currentExerciseState.restDuration! - elapsed);
        
        
        onUpdateExerciseState(currentExerciseName, {
          timeLeft: newTimeLeft,
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
  }, [currentExerciseState?.isResting, currentExerciseState?.startTimestamp, currentExerciseState?.restDuration, currentExerciseName, onUpdateExerciseState]);

  // Auto-enable finish set button when timer finishes
  useEffect(() => {
    if (currentExerciseState?.isResting && currentExerciseState.timeLeft === 0) {
      onUpdateExerciseState(currentExerciseName, {
        isResting: false,
        startTimestamp: undefined,
        restDuration: undefined,
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

    // Capture current set data (weight and repeats)
    const currentSetData = {
      weight: currentExerciseState.weight && currentExerciseState.weight > 0 ? currentExerciseState.weight : undefined,
      repeats: currentExerciseState.repeats && currentExerciseState.repeats > 0 ? currentExerciseState.repeats : undefined,
    };

    // Add current set data to the sets array
    const updatedSetsData = [...(currentExerciseState.setsData || []), currentSetData];

    if (isExerciseComplete) {
      onUpdateExerciseState(currentExerciseName, {
        currentSet: newSetCount,
        completed: true,
        isActive: false,
        isResting: false,
        setsData: updatedSetsData,
      });
      
      // Show feedback modal when exercise is completed
      setFeedbackModal(currentExerciseName);
    } else {
      const restTime = currentExerciseState.customRestTime || trainingState.restTime;
      const now = Date.now();
      onUpdateExerciseState(currentExerciseName, {
        currentSet: newSetCount,
        isResting: true,
        timeLeft: restTime,
        startTimestamp: now,
        restDuration: restTime,
        setsData: updatedSetsData,
      });
    }
  };

  const updateCustomRestTime = (newRestTime: number) => {
    onUpdateExerciseState(currentExerciseName, {
      customRestTime: newRestTime,
    });
  };

  const updateWeight = (newWeight: number) => {
    onUpdateExerciseState(currentExerciseName, {
      weight: newWeight,
    });
  };

  const updateRepeats = (newRepeats: number) => {
    onUpdateExerciseState(currentExerciseName, {
      repeats: newRepeats,
    });
  };


  const handleSeeHistory = () => {
    setHistoryModal(currentExerciseName);
  };

  const handleSeeInfo = () => {
    setInfoModal(currentExerciseName);
  };

  const handleSeeLastTraining = () => {
    setLastTrainingModal(currentExerciseName);
  };

  const handleEditExercise = (exerciseName: string) => {
    console.log('=== handleEditExercise DEBUG ===');
    console.log('exerciseName passed:', exerciseName);
    console.log('Available exercises in training:', Object.keys(trainings[trainingState.selectedTraining!]));
    console.log('Does exercise exist?', !!trainings[trainingState.selectedTraining!][exerciseName]);
    
    setInfoModal(null); // Close info modal
    setEditModal(exerciseName);
  };

  const handleSaveExerciseEdit = (exerciseName: string, customTitle: string, customNote: string) => {
    saveCustomExerciseData(exerciseName, customTitle, customNote);
    setEditModal(null);
  };

  const handleMainAreaClick = () => {
    if (!currentExerciseState.isActive && !currentExerciseState.completed) {
      startExercise();
    } else if (currentExerciseState.isActive && !currentExerciseState.completed && !(currentExerciseState.isResting && currentExerciseState.timeLeft > 0)) {
      finishSet();
    } else if (currentExerciseState.completed) {
      onNextExercise();
    }
  };


  const handleFeedbackSave = (weight?: number, restTime?: number, repeats?: number) => {
    if (feedbackModal) {
      saveExerciseDefaults(feedbackModal, weight, restTime, repeats);
    }
  };

  const handleFeedbackClose = () => {
    const completedExercise = feedbackModal && trainingState.exerciseStates[feedbackModal]?.completed;
    
    setFeedbackModal(null);
    
    // If an exercise was just completed, check if training is now complete
    if (completedExercise) {
      // Check if all exercises are completed
      const allCompleted = trainingState.exercises.every(
        exerciseName => trainingState.exerciseStates[exerciseName].completed
      );
      if (allCompleted) {
        onNextExercise(); // This will trigger the completion check in App.tsx
      }
    }
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
      {/* 1. Training Header */}
      <div className="section-training-header">
        <h2>{trainingState.selectedTraining} אימון</h2>
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
      </div>

      <div className="section-divider"></div>

      {/* 3. All Exercises */}
      <div className="section-all-exercises">
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

            const shortName = trainings[trainingState.selectedTraining!][exerciseName].short;

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

      <div className="section-divider"></div>

      {/* 4. Exercise Title */}
      <div className="section-exercise-title">
        <div className="exercise-name">{getCustomExerciseTitle(currentExerciseName)}</div>
      </div>

      <div className="section-divider"></div>

      {/* 2. Exercise Inputs and Buttons */}
      <div className="section-exercise-controls">
        <div className="header-actions-row">
          <button
            className="header-action-btn"
            onClick={handleSeeHistory}
            title="היסטוריית תרגיל"
          >
            📊
          </button>
          <button
            className="header-action-btn"
            onClick={handleSeeLastTraining}
            title="אימון אחרון"
          >
            📋
          </button>
          <button
            className="header-action-btn"
            onClick={handleSeeInfo}
            title="פרטי תרגיל"
          >
            ℹ️
          </button>
        </div>
        
        <div className="header-forms-row" onClick={(e) => e.stopPropagation()}>
          <div className="header-rest-time">
            <div className="rest-time-label">מנוחה</div>
            <input
              type="number"
              inputMode="decimal"
              pattern="[0-9]*\.?[0-9]*"
              value={currentExerciseState?.customRestTime || ''}
              onChange={(e) => updateCustomRestTime(Number(e.target.value))}
              placeholder={trainingState.restTime.toString()}
              min="10"
              max="300"
              step="5"
              className="rest-time-input"
            />
          </div>
          <div className="header-weight">
            <div className="weight-label">משקל</div>
            <input
              type="number"
              inputMode="decimal"
              pattern="[0-9]*\.?[0-9]*"
              value={currentExerciseState?.weight || ''}
              onChange={(e) => updateWeight(Number(e.target.value))}
              placeholder="יאללה"
              min="0"
              max="500"
              step="0.5"
              className="weight-input"
            />
          </div>
          <div className="header-repeats">
            <div className="repeats-label">חזרות</div>
            <input
              type="number"
              inputMode="decimal"
              pattern="[0-9]*\.?[0-9]*"
              value={currentExerciseState?.repeats || ''}
              onChange={(e) => updateRepeats(Number(e.target.value))}
              placeholder="חזרות"
              min="1"
              max="50"
              step="1"
              className="repeats-input"
            />
          </div>
        </div>
      </div>

      <div className="section-divider"></div>

      {/* 5. Main Action Area and Progress - Clickable */}
      <div className="section-main-action-area clickable-area" onClick={handleMainAreaClick}>
        {/* Timer */}
        {currentExerciseState.isResting && (
          <div className={`timer ${
            currentExerciseState.timeLeft === 0 ? 'finished' :
            currentExerciseState.timeLeft <= 5 && currentExerciseState.timeLeft > 0 ? 'urgent' : ''
          }`}>
            {currentExerciseState.timeLeft === 0 ? 'זמן!' : formatTime(currentExerciseState.timeLeft)}
          </div>
        )}

        {/* Main Action Buttons */}
        <div className="main-exercise-actions" onClick={(e) => e.stopPropagation()}>
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
              className="orange-button"
              onClick={finishSet}
              style={{ fontSize: '18px' }}
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

        {/* Progress */}
        <div className="sets-progress-container">
          <div className="sets-counter">
            {currentExerciseState.isResting ? 
              `סיימת ${currentExerciseState.currentSet} מתוך ${currentExercise.numberOfSets} סטים` :
              currentExerciseState.isActive ? 
                `סט מספר ${currentExerciseState.currentSet + 1}` :
                `${currentExerciseState.currentSet}/${currentExercise.numberOfSets} סטים`
            }
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
      </div>

      {/* Exercise History Modal */}
      {historyModal && (
        <ExerciseHistory
          exerciseName={historyModal}
          onClose={() => setHistoryModal(null)}
        />
      )}
      
      {/* Exercise Feedback Modal */}
      {feedbackModal && (
        <ExerciseFeedback
          exerciseName={feedbackModal}
          currentWeight={
            trainingState.exerciseStates[feedbackModal]?.setsData?.[0]?.weight ||
            getDefaultWeight(feedbackModal) ||
            trainingState.exerciseStates[feedbackModal]?.weight
          }
          currentRestTime={getDefaultRestTime(feedbackModal) || trainingState.exerciseStates[feedbackModal]?.customRestTime || trainingState.restTime}
          currentRepeats={
            trainingState.exerciseStates[feedbackModal]?.setsData?.[0]?.repeats ||
            getDefaultRepeats(feedbackModal) ||
            trainingState.exerciseStates[feedbackModal]?.repeats
          }
          exercise={trainings[trainingState.selectedTraining!][feedbackModal]}
          completedSetsData={trainingState.exerciseStates[feedbackModal]?.setsData || []}
          totalSets={trainings[trainingState.selectedTraining!][feedbackModal].numberOfSets}
          onSave={handleFeedbackSave}
          onClose={handleFeedbackClose}
        />
      )}
      
      {/* Exercise Info Modal */}
      {infoModal && (
        <ExerciseInfo
          exerciseName={infoModal}
          exercise={{
            ...trainings[trainingState.selectedTraining!][infoModal],
            note: getCustomExerciseNote(infoModal, trainings[trainingState.selectedTraining!][infoModal].note)
          }}
          onClose={() => setInfoModal(null)}
          onEdit={handleEditExercise}
        />
      )}
      
      {/* Exercise Edit Modal */}
      {editModal && trainings[trainingState.selectedTraining!][editModal] && (
        <ExerciseEdit
          exerciseName={editModal}
          exercise={{
            ...trainings[trainingState.selectedTraining!][editModal],
            note: getCustomExerciseNote(editModal, trainings[trainingState.selectedTraining!][editModal].note)
          }}
          onSave={handleSaveExerciseEdit}
          onClose={() => setEditModal(null)}
        />
      )}
      
      {/* Last Training Details Modal */}
      {lastTrainingModal && (
        <LastTrainingDetails
          exerciseName={lastTrainingModal}
          onClose={() => setLastTrainingModal(null)}
        />
      )}
    </div>
  );
};

export default ExerciseFlow;
