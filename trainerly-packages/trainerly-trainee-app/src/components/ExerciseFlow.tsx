import React, { useState, useEffect } from 'react';
import { TrainingState, ExerciseState, Trainings } from '../types';
import ExerciseHistory from './ExerciseHistory';
import ExerciseFeedback from './ExerciseFeedback';
import ExerciseInfo from './ExerciseInfo';
import ExerciseEdit from './ExerciseEdit';
import { saveExerciseDefaults, saveCustomExerciseData, getCustomExerciseTitle, getCustomExerciseNote, getDefaultWeight, getDefaultRepeats, getDefaultRestTime, updateTodaysExerciseEntry } from '../utils/exerciseHistory';
import { playEndSetBeep, playCountdownBeep } from '../utils/soundUtils';

interface ExerciseFlowProps {
  trainingState: TrainingState;
  trainings: Trainings;
  trainingPlanId: string;
  onUpdateExerciseState: (exerciseName: string, updates: Partial<ExerciseState>) => void;
  onGoToExercise: (exerciseIndex: number) => void;
  onNextExercise: () => void;
  onResetTraining: () => void;
}

const ExerciseFlow: React.FC<ExerciseFlowProps> = ({
  trainingState,
  trainings,
  trainingPlanId,
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
  const [showEndExerciseConfirm, setShowEndExerciseConfirm] = useState(false);
  const [showFinishExerciseOptions, setShowFinishExerciseOptions] = useState(false);
  const [showEditSetsModal, setShowEditSetsModal] = useState(false);
  const [editingSetsData, setEditingSetsData] = useState<{weight?: number, repeats?: number}[]>([]);


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

  // Countdown sound effect for last 5 seconds
  useEffect(() => {
    if (currentExerciseState?.isResting && currentExerciseState.timeLeft !== undefined) {
      const timeLeft = currentExerciseState.timeLeft;
      
      // Play countdown sounds for last 5 seconds (5, 4, 3, 2, 1, 0)
      if (timeLeft <= 5 && timeLeft >= 0) {
        playCountdownBeep(timeLeft);
      }
    }
  }, [currentExerciseState?.timeLeft]);

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
    // Play end set beep sound
    playEndSetBeep();
    
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
      // Complete the exercise automatically when all sets are done naturally
      onUpdateExerciseState(currentExerciseName, {
        currentSet: newSetCount,
        completed: true,
        isActive: false,
        isResting: false,
        setsData: updatedSetsData,
      });
      
      // Show feedback modal when exercise is completed naturally
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


  const handleConfirmEndExercise = () => {
    // Mark exercise as completed with all sets done at target values
    const targetWeight = currentExerciseState.weight || getDefaultWeight(currentExerciseName, trainingPlanId) || 0;
    const targetRepeats = currentExerciseState.repeats || getDefaultRepeats(currentExerciseName, trainingPlanId) || currentExercise.minimumNumberOfRepeasts;
    
    // Create sets data for all remaining sets with target values
    const completedSetsData = [];
    for (let i = 0; i < currentExercise.numberOfSets; i++) {
      completedSetsData.push({
        weight: targetWeight,
        repeats: targetRepeats,
      });
    }

    // Mark as completed
    onUpdateExerciseState(currentExerciseName, {
      currentSet: currentExercise.numberOfSets,
      completed: true,
      isActive: false,
      isResting: false,
      timeLeft: undefined,
      startTimestamp: undefined,
      restDuration: undefined,
      setsData: completedSetsData,
    });

    setShowEndExerciseConfirm(false);
    // Show feedback modal when exercise is completed
    setFeedbackModal(currentExerciseName);
  };

  const handleCancelEndExercise = () => {
    setShowEndExerciseConfirm(false);
  };

  // New finish exercise options handlers
  const handleFinishAsSuccess = () => {
    // If we're not at the last set, complete all remaining sets with target values
    const targetWeight = currentExerciseState.weight || getDefaultWeight(currentExerciseName, trainingPlanId) || 0;
    const targetRepeats = currentExerciseState.repeats || getDefaultRepeats(currentExerciseName, trainingPlanId) || currentExercise.minimumNumberOfRepeasts;
    
    // Get existing sets data and fill remaining sets
    const existingSetsData = currentExerciseState.setsData || [];
    const completedSetsData = [...existingSetsData];
    
    // Fill remaining sets with target values
    for (let i = existingSetsData.length; i < currentExercise.numberOfSets; i++) {
      completedSetsData.push({
        weight: targetWeight,
        repeats: targetRepeats,
      });
    }
    
    // Mark exercise as completed
    onUpdateExerciseState(currentExerciseName, {
      currentSet: currentExercise.numberOfSets,
      completed: true,
      isActive: false,
      isResting: false,
      setsData: completedSetsData,
    });
    
    setShowFinishExerciseOptions(false);
    // Show feedback modal when exercise is completed
    setFeedbackModal(currentExerciseName);
  };

  const handleFinishAndEditData = () => {
    // Initialize editing data with current sets data
    const currentSetsData = currentExerciseState.setsData || [];
    const editingData = [];
    
    for (let i = 0; i < currentExercise.numberOfSets; i++) {
      if (i < currentSetsData.length) {
        editingData.push({ ...currentSetsData[i] });
      } else {
        // Fill missing sets with default values
        editingData.push({
          weight: currentExerciseState.weight || getDefaultWeight(currentExerciseName, trainingPlanId),
          repeats: currentExerciseState.repeats || getDefaultRepeats(currentExerciseName, trainingPlanId) || currentExercise.minimumNumberOfRepeasts
        });
      }
    }
    
    setEditingSetsData(editingData);
    setShowFinishExerciseOptions(false);
    setShowEditSetsModal(true);
  };

  const handleCancelFinishOptions = () => {
    // Since this modal only appears when manually triggered, just close it
    setShowFinishExerciseOptions(false);
  };

  const handleSaveEditedSets = () => {
    // Update exercise state with edited sets data
    onUpdateExerciseState(currentExerciseName, {
      completed: true,
      isActive: false,
      isResting: false,
      setsData: editingSetsData,
    });
    
    setShowEditSetsModal(false);
    setEditingSetsData([]);
    // Show feedback modal when exercise is completed
    setFeedbackModal(currentExerciseName);
  };

  const handleCancelEditSets = () => {
    setShowEditSetsModal(false);
    setEditingSetsData([]);
    // Only go back to finish options if exercise is not completed
    // (meaning we came from the finish options modal)
    if (!currentExerciseState.completed) {
      setShowFinishExerciseOptions(true);
    }
    // If exercise is completed, just close the modal (we came from edit button)
  };

  // Handler for editing completed exercises
  const handleEditCompletedExercise = () => {
    // Initialize editing data with current sets data
    const currentSetsData = currentExerciseState.setsData || [];
    const editingData = [];
    
    for (let i = 0; i < currentExercise.numberOfSets; i++) {
      if (i < currentSetsData.length) {
        editingData.push({ ...currentSetsData[i] });
      } else {
        editingData.push({
          weight: getDefaultWeight(currentExerciseName, trainingPlanId),
          repeats: getDefaultRepeats(currentExerciseName, trainingPlanId) || currentExercise.minimumNumberOfRepeasts
        });
      }
    }
    
    setEditingSetsData(editingData);
    setShowEditSetsModal(true);
  };

  const handleSaveEditedCompletedExercise = () => {
    // Update exercise state with edited sets data
    onUpdateExerciseState(currentExerciseName, {
      setsData: editingSetsData,
    });
    
    // Also update today's history entry
    updateTodaysExerciseEntry(currentExerciseName, editingSetsData);
    
    setShowEditSetsModal(false);
    setEditingSetsData([]);
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
      saveExerciseDefaults(feedbackModal, trainingPlanId, weight, restTime, repeats);
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

  const handleClearTodayTraining = () => {
    const confirmed = window.confirm(
      `האם אתה בטוח שברצונך למחוק את נתוני האימון של היום עבור "${trainingState.selectedTraining}"?\n\nפעולה זו תמחק את כל ההתקדמות של האימון הנוכחי ולא ניתן לבטל אותה.`
    );

    if (confirmed) {
      // Reset all exercise states for current training
      trainingState.exercises.forEach(exerciseName => {
        onUpdateExerciseState(exerciseName, {
          currentSet: 0,
          completed: false,
          isActive: false,
          isResting: false,
          timeLeft: undefined,
          startTimestamp: undefined,
          restDuration: undefined,
          weight: undefined,
          repeats: undefined,
          customRestTime: undefined,
          setsData: []
        });
      });

      // Show confirmation message
      alert(`נתוני האימון "${trainingState.selectedTraining}" של היום נמחקו בהצלחה.`);
      
      // Reset to first exercise
      onGoToExercise(0);
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
        {/* Hidden clear training data button */}
        <button
          onClick={handleClearTodayTraining}
          style={{
            position: 'absolute',
            top: '20px',
            right: '20px',
            width: '40px',
            height: '40px',
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
            opacity: 0,
            zIndex: 10
          }}
          title="מחק נתוני אימון של היום"
        >
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

            const muscleGroup = trainings[trainingState.selectedTraining!][exerciseName].muscleGroup || 'כללי';

            return (
              <div
                key={exerciseName}
                className={className}
                onClick={() => onGoToExercise(index)}
                title={exerciseName} // Show full name on hover
              >
                <div className="exercise-row-number">{index + 1}</div>
                <div className="exercise-row-name">{muscleGroup}</div>
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
            onClick={handleSeeInfo}
            title="פרטי תרגיל"
          >
            ℹ️
          </button>
          {!currentExerciseState.completed ? (
            <button
              className="header-action-btn"
              onClick={() => setShowFinishExerciseOptions(true)}
              title="סיים תרגיל"
              style={{ 
                background: '#ff6b6b',
                borderColor: '#ff5252'
              }}
            >
              ⏹️
            </button>
          ) : (
            <button
              className="header-action-btn"
              onClick={handleEditCompletedExercise}
              title="ערוך נתוני תרגיל"
              style={{ 
                background: '#ff9800',
                borderColor: '#ff8f00'
              }}
            >
              ✏️
            </button>
          )}
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
          trainingPlanId={trainingPlanId}
          trainingType={trainingState.selectedTraining || undefined}
        />
      )}
      
      {/* Exercise Feedback Modal */}
      {feedbackModal && (
        <ExerciseFeedback
          exerciseName={feedbackModal}
          currentWeight={
            trainingState.exerciseStates[feedbackModal]?.setsData?.[0]?.weight ||
            getDefaultWeight(feedbackModal, trainingPlanId) ||
            trainingState.exerciseStates[feedbackModal]?.weight
          }
          currentRestTime={getDefaultRestTime(feedbackModal, trainingPlanId) || trainingState.exerciseStates[feedbackModal]?.customRestTime || trainingState.restTime}
          currentRepeats={
            trainingState.exerciseStates[feedbackModal]?.setsData?.[0]?.repeats ||
            getDefaultRepeats(feedbackModal, trainingPlanId) ||
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
      

      {/* End Exercise Confirmation Modal */}
      {showEndExerciseConfirm && (
        <div className="modal-overlay" onClick={handleCancelEndExercise}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>סיום תרגיל</h3>
            </div>
            <div className="modal-body">
              <p>האם אתה בטוח שברצונך לסיים את התרגיל?</p>
              <p>התרגיל יסומן כמושלם עם כל הסטים בערכי היעד.</p>
            </div>
            <div className="modal-footer">
              <button
                className="red-button"
                onClick={handleConfirmEndExercise}
                style={{ marginLeft: '10px' }}
              >
                כן, סיים תרגיל
              </button>
              <button
                className="gray-button"
                onClick={handleCancelEndExercise}
              >
                ביטול
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Finish Exercise Options Modal */}
      {showFinishExerciseOptions && (
        <div className="info-overlay" onClick={handleCancelFinishOptions}>
          <div className="info-modal" onClick={(e) => e.stopPropagation()}>
            <div className="info-header">
              <h2>סיום תרגיל</h2>
              <button className="close-button" onClick={handleCancelFinishOptions}>
                ✕
              </button>
            </div>
            <div className="info-content">
              <div style={{ padding: 'var(--space-6)', textAlign: 'center' }}>
                <p style={{ marginBottom: 'var(--space-6)', fontSize: 'var(--text-lg)', color: 'var(--text-primary)' }}>
                  איך תרצה לסיים את התרגיל?
                </p>
                <div style={{ 
                  display: 'flex', 
                  flexDirection: 'column', 
                  gap: 'var(--space-4)',
                  alignItems: 'stretch'
                }}>
                  <button
                    className="green-button"
                    onClick={handleFinishAsSuccess}
                    style={{ 
                      width: '100%', 
                      padding: '15px', 
                      fontSize: '16px',
                      minHeight: '56px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      margin: '0',
                      minWidth: 'auto'
                    }}
                  >
                    ✅ סיים בהצלחה
                  </button>
                  <button
                    className="orange-button"
                    onClick={handleFinishAndEditData}
                    style={{ 
                      width: '100%', 
                      padding: '15px', 
                      fontSize: '16px',
                      minHeight: '56px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      margin: '0',
                      minWidth: 'auto'
                    }}
                  >
                    ✏️ סיים וערוך נתונים
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Sets Data Modal - Stunning Enhanced Version */}
      {showEditSetsModal && (
        <div className="info-overlay" onClick={handleCancelEditSets}>
          <div className="info-modal" onClick={(e) => e.stopPropagation()} style={{ 
            maxWidth: '700px',
            background: 'linear-gradient(145deg, rgba(30, 41, 59, 0.95) 0%, rgba(15, 23, 42, 0.98) 50%, rgba(30, 41, 59, 0.95) 100%)',
            backdropFilter: 'blur(30px)',
            border: '2px solid rgba(99, 102, 241, 0.3)',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.6), 0 0 0 1px rgba(255, 255, 255, 0.05), inset 0 1px 0 rgba(255, 255, 255, 0.1), 0 0 60px rgba(99, 102, 241, 0.4)',
            position: 'relative',
            overflow: 'hidden'
          }}>
            {/* Gradient overlay */}
            <div style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'linear-gradient(145deg, rgba(16, 185, 129, 0.08) 0%, rgba(99, 102, 241, 0.06) 25%, rgba(236, 72, 153, 0.04) 50%, rgba(99, 102, 241, 0.06) 75%, rgba(16, 185, 129, 0.08) 100%)',
              zIndex: -1,
              borderRadius: 'inherit',
              animation: 'shimmer 8s ease-in-out infinite'
            }} />
            
            <div className="info-header">
              <h2>ערוך נתוני סטים</h2>
              <button className="close-button" onClick={handleCancelEditSets}>
                ✕
              </button>
            </div>
            
            <div className="info-content" style={{ maxHeight: '70vh', overflow: 'auto' }}>
              <div style={{ padding: 'var(--space-6)' }}>
                <div style={{ 
                  display: 'grid', 
                  gap: 'var(--space-5)',
                  animation: 'fadeInUp 0.6s ease-out'
                }}>
                  {editingSetsData.map((setData, index) => (
                    <div key={index} style={{ 
                      background: 'linear-gradient(145deg, rgba(55, 65, 81, 0.8) 0%, rgba(31, 41, 55, 0.9) 100%)', 
                      padding: 'var(--space-5)', 
                      borderRadius: 'var(--radius-xl)',
                      border: '1px solid rgba(99, 102, 241, 0.2)',
                      boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.3), 0 0 20px rgba(99, 102, 241, 0.1)',
                      position: 'relative',
                      overflow: 'hidden',
                      transition: 'all 0.3s ease',
                      animation: `fadeInUp 0.6s ease-out ${index * 0.1}s both`
                    }}>
                      <h4 style={{ 
                        margin: '0 0 var(--space-4) 0', 
                        fontSize: 'var(--text-xl)', 
                        fontWeight: '800',
                        background: 'linear-gradient(135deg, #10b981, #6366f1)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        backgroundClip: 'text',
                        textAlign: 'right'
                      }}>
                        סט {index + 1}
                      </h4>
                      
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
                        <div>
                          <label style={{ 
                            display: 'block', 
                            marginBottom: 'var(--space-3)', 
                            fontSize: 'var(--text-sm)',
                            fontWeight: '700',
                            color: '#10b981',
                            textTransform: 'uppercase',
                            letterSpacing: '0.05em'
                          }}>
                            🏋️ משקל (ק"ג)
                          </label>
                          <input
                            type="number"
                            value={setData.weight || ''}
                            onChange={(e) => {
                              const newData = [...editingSetsData];
                              newData[index] = { ...newData[index], weight: parseFloat(e.target.value) || undefined };
                              setEditingSetsData(newData);
                            }}
                            style={{
                              width: '100%',
                              padding: 'var(--space-4)',
                              border: '2px solid rgba(16, 185, 129, 0.2)',
                              borderRadius: 'var(--radius-lg)',
                              background: 'linear-gradient(145deg, rgba(16, 185, 129, 0.05) 0%, rgba(6, 182, 212, 0.05) 100%)',
                              color: 'var(--text-primary)',
                              fontSize: 'var(--text-lg)',
                              fontWeight: '700',
                              textAlign: 'center',
                              transition: 'all 0.3s ease',
                              outline: 'none',
                              boxShadow: '0 4px 12px rgba(16, 185, 129, 0.1)',
                            }}
                            placeholder="משקל"
                            onFocus={(e) => {
                              const target = e.target as HTMLInputElement;
                              target.style.borderColor = '#10b981';
                              target.style.boxShadow = '0 0 20px rgba(16, 185, 129, 0.3), 0 4px 12px rgba(16, 185, 129, 0.2)';
                              target.style.transform = 'translateY(-2px)';
                            }}
                            onBlur={(e) => {
                              const target = e.target as HTMLInputElement;
                              target.style.borderColor = 'rgba(16, 185, 129, 0.2)';
                              target.style.boxShadow = '0 4px 12px rgba(16, 185, 129, 0.1)';
                              target.style.transform = 'translateY(0)';
                            }}
                          />
                        </div>
                        <div>
                          <label style={{ 
                            display: 'block', 
                            marginBottom: 'var(--space-3)', 
                            fontSize: 'var(--text-sm)',
                            fontWeight: '700',
                            color: '#6366f1',
                            textTransform: 'uppercase',
                            letterSpacing: '0.05em'
                          }}>
                            🔢 חזרות
                          </label>
                          <input
                            type="number"
                            value={setData.repeats || ''}
                            onChange={(e) => {
                              const newData = [...editingSetsData];
                              newData[index] = { ...newData[index], repeats: parseInt(e.target.value) || undefined };
                              setEditingSetsData(newData);
                            }}
                            style={{
                              width: '100%',
                              padding: 'var(--space-4)',
                              border: '2px solid rgba(99, 102, 241, 0.2)',
                              borderRadius: 'var(--radius-lg)',
                              background: 'linear-gradient(145deg, rgba(99, 102, 241, 0.05) 0%, rgba(168, 85, 247, 0.05) 100%)',
                              color: 'var(--text-primary)',
                              fontSize: 'var(--text-lg)',
                              fontWeight: '700',
                              textAlign: 'center',
                              transition: 'all 0.3s ease',
                              outline: 'none',
                              boxShadow: '0 4px 12px rgba(99, 102, 241, 0.1)',
                            }}
                            placeholder="חזרות"
                            onFocus={(e) => {
                              const target = e.target as HTMLInputElement;
                              target.style.borderColor = '#6366f1';
                              target.style.boxShadow = '0 0 20px rgba(99, 102, 241, 0.3), 0 4px 12px rgba(99, 102, 241, 0.2)';
                              target.style.transform = 'translateY(-2px)';
                            }}
                            onBlur={(e) => {
                              const target = e.target as HTMLInputElement;
                              target.style.borderColor = 'rgba(99, 102, 241, 0.2)';
                              target.style.boxShadow = '0 4px 12px rgba(99, 102, 241, 0.1)';
                              target.style.transform = 'translateY(0)';
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                
                <div style={{ 
                  marginTop: 'var(--space-8)', 
                  display: 'flex', 
                  justifyContent: 'center',
                  animation: 'fadeInUp 0.6s ease-out 0.3s both'
                }}>
                  <button
                    className="green-button"
                    onClick={currentExerciseState.completed ? handleSaveEditedCompletedExercise : handleSaveEditedSets}
                    style={{ 
                      padding: '18px 40px', 
                      fontSize: '18px',
                      fontWeight: '800',
                      background: 'linear-gradient(135deg, #10b981, #059669)',
                      border: 'none',
                      borderRadius: 'var(--radius-xl)',
                      color: 'white',
                      boxShadow: '0 10px 25px -5px rgba(16, 185, 129, 0.4), 0 0 20px rgba(16, 185, 129, 0.2)',
                      transition: 'all 0.3s ease',
                      position: 'relative',
                      overflow: 'hidden'
                    }}
                    onMouseEnter={(e) => {
                      const target = e.target as HTMLButtonElement;
                      target.style.transform = 'translateY(-3px) scale(1.05)';
                      target.style.boxShadow = '0 15px 35px -5px rgba(16, 185, 129, 0.5), 0 0 30px rgba(16, 185, 129, 0.3)';
                    }}
                    onMouseLeave={(e) => {
                      const target = e.target as HTMLButtonElement;
                      target.style.transform = 'translateY(0) scale(1)';
                      target.style.boxShadow = '0 10px 25px -5px rgba(16, 185, 129, 0.4), 0 0 20px rgba(16, 185, 129, 0.2)';
                    }}
                  >
                    💾 שמור שינויים
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExerciseFlow;
