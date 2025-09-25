import React, { useState, useEffect } from 'react';
import { cachedApiService, Trainee } from '../services/cachedApiService';
import { showError } from './ToastContainer';
import LoadingSpinner from './LoadingSpinner';
import './TraineeTrainingHistory.css';

interface ExerciseSession {
  sessionId: string;
  trainerId: string;
  coachId: string;
  exerciseName: string;
  trainingType: string;
  completedAt: string;
  totalSets: number;
  completedSets: number;
  setsData: Array<{
    weight?: number;
    repeats?: number;
  }>;
  restTime?: number;
  createdAt: string;
}

interface TrainingSession {
  trainingType: string;
  date: string;
  exercises: ExerciseSession[];
  completedExercises: number;
  totalExercises: number;
}

interface TraineeTrainingHistoryProps {
  trainee: Trainee;
  coachId: string;
  token: string;
  onBack: () => void;
}

const TraineeTrainingHistory: React.FC<TraineeTrainingHistoryProps> = ({
  trainee,
  coachId,
  token,
  onBack
}) => {
  const [sessions, setSessions] = useState<ExerciseSession[]>([]);
  const [trainingSessions, setTrainingSessions] = useState<TrainingSession[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTraining, setSelectedTraining] = useState<TrainingSession | null>(null);
  const [selectedExercise, setSelectedExercise] = useState<ExerciseSession | null>(null);

  useEffect(() => {
    loadTrainingHistory();
  }, [trainee.trainerId]);

  const loadTrainingHistory = async () => {
    try {
      setLoading(true);
      
      // Force refresh to bypass cache - exercise sessions change frequently
      const sessionsResult = await cachedApiService.getTraineeExerciseSessions(
        coachId, 
        trainee.trainerId, 
        token, 
        100, // Get last 100 sessions
        { forceRefresh: true }
      );
      
      const allSessions = sessionsResult.data;
      setSessions(allSessions);
      
      // Group sessions by training type and date
      const groupedTrainings = groupSessionsByTraining(allSessions);
      setTrainingSessions(groupedTrainings);
      
      setError(null);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to load training history';
      setError(errorMsg);
      showError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const groupSessionsByTraining = (sessions: ExerciseSession[]): TrainingSession[] => {
    // Group by training type and date (YYYY-MM-DD)
    const grouped: { [key: string]: ExerciseSession[] } = {};
    
    sessions.forEach(session => {
      const date = session.completedAt.split('T')[0]; // Get just the date part
      const key = `${session.trainingType}-${date}`;
      
      if (!grouped[key]) {
        grouped[key] = [];
      }
      grouped[key].push(session);
    });

    // Convert to TrainingSession objects and sort by date (most recent first)
    const trainingSessions: TrainingSession[] = Object.entries(grouped)
      .map(([key, exercises]) => {
        const [trainingType, date] = key.split('-', 2);
        const uniqueExercises = getUniqueExercises(exercises);
        
        return {
          trainingType,
          date,
          exercises,
          completedExercises: uniqueExercises.length,
          totalExercises: uniqueExercises.length // We only have completed exercises in the data
        };
      })
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return trainingSessions;
  };

  const getUniqueExercises = (exercises: ExerciseSession[]): string[] => {
    const unique = new Set(exercises.map(ex => ex.exerciseName));
    return Array.from(unique);
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        return 'תאריך לא תקין';
      }
      return date.toLocaleDateString('he-IL', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        weekday: 'short'
      });
    } catch (error) {
      return 'תאריך לא תקין';
    }
  };

  const formatDateTime = (dateString: string) => {
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        return 'תאריך לא תקין';
      }
      return date.toLocaleDateString('he-IL', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      return 'תאריך לא תקין';
    }
  };

  const formatRestTime = (seconds?: number) => {
    if (!seconds) return '-';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleTrainingClick = (training: TrainingSession) => {
    setSelectedTraining(training);
    setSelectedExercise(null);
  };

  const handleExerciseClick = (exercise: ExerciseSession) => {
    setSelectedExercise(exercise);
  };

  const handleBackToTrainingList = () => {
    setSelectedTraining(null);
    setSelectedExercise(null);
  };

  const handleBackToExerciseList = () => {
    setSelectedExercise(null);
  };

  if (loading) {
    return <LoadingSpinner message="טוען היסטוריית אימונים..." fullScreen={true} />;
  }

  if (error) {
    return (
      <div className="training-history-error">
        <div className="error-container">
          <div className="error-icon">⚠️</div>
          <div className="error-text">שגיאה: {error}</div>
          <button onClick={loadTrainingHistory} className="retry-button">
            <span className="button-icon">🔄</span>
            נסה שוב
          </button>
        </div>
      </div>
    );
  }

  // Detailed exercise view (like trainee sees it)
  if (selectedExercise) {
    return (
      <div className="training-history" dir="rtl">
        <div className="history-header">
          <button onClick={handleBackToExerciseList} className="back-button">
            ← חזרה לרשימת תרגילים
          </button>
          <div className="header-content">
            <h1 className="page-title">
              <span className="title-icon">🏋️</span>
              פרטי תרגיל - {selectedExercise.exerciseName}
            </h1>
          </div>
        </div>

        <div className="exercise-details-container">
          <div className="exercise-header-info">
            <div className="exercise-meta">
              <div className="meta-item">
                <span className="meta-label">תאריך:</span>
                <span className="meta-value">{formatDateTime(selectedExercise.completedAt)}</span>
              </div>
              <div className="meta-item">
                <span className="meta-label">אימון:</span>
                <span className="meta-value">{selectedExercise.trainingType}</span>
              </div>
              <div className="meta-item">
                <span className="meta-label">זמן מנוחה:</span>
                <span className="meta-value">{formatRestTime(selectedExercise.restTime)}</span>
              </div>
              <div className="meta-item">
                <span className="meta-label">סטים:</span>
                <span className="meta-value">{selectedExercise.completedSets}/{selectedExercise.totalSets}</span>
              </div>
            </div>
          </div>

          {selectedExercise.setsData && selectedExercise.setsData.length > 0 ? (
            <div className="sets-details">
              <h3>פירוט סטים:</h3>
              <div className="sets-grid">
                {selectedExercise.setsData.map((setData, index) => {
                  // Get the target values from the first set of this specific workout
                  const firstSet = selectedExercise.setsData?.[0];
                  const targetWeight = firstSet?.weight;
                  const targetRepeats = firstSet?.repeats;

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
            </div>
          ) : (
            <div className="no-sets-data">
              <p>אין פירוט סטים זמין (אימון ישן)</p>
              <div className="summary-info">
                <div className="summary-item">
                  <span className="summary-label">סטים שהושלמו:</span>
                  <span className="summary-value">{selectedExercise.completedSets}/{selectedExercise.totalSets}</span>
                </div>
                {selectedExercise.restTime && (
                  <div className="summary-item">
                    <span className="summary-label">זמן מנוחה:</span>
                    <span className="summary-value">{formatRestTime(selectedExercise.restTime)}</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Exercise list view for selected training
  if (selectedTraining) {
    const exerciseGroups = selectedTraining.exercises.reduce((groups, session) => {
      if (!groups[session.exerciseName]) {
        groups[session.exerciseName] = [];
      }
      groups[session.exerciseName].push(session);
      return groups;
    }, {} as { [exerciseName: string]: ExerciseSession[] });

    return (
      <div className="training-history" dir="rtl">
        <div className="history-header">
          <button onClick={handleBackToTrainingList} className="back-button">
            ← חזרה לרשימת אימונים
          </button>
          <div className="header-content">
            <h1 className="page-title">
              <span className="title-icon">📋</span>
              תרגילים - אימון {selectedTraining.trainingType}
            </h1>
            <p className="page-subtitle">{formatDate(selectedTraining.date)}</p>
          </div>
        </div>

        <div className="exercises-list">
          {Object.entries(exerciseGroups).map(([exerciseName, exerciseSessions]) => {
            // Take the most recent session for this exercise on this date
            const latestSession = exerciseSessions.sort((a, b) => 
              new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime()
            )[0];

            return (
              <div 
                key={exerciseName} 
                className="exercise-card clickable"
                onClick={() => handleExerciseClick(latestSession)}
              >
                <div className="exercise-header">
                  <h3 className="exercise-name">{exerciseName}</h3>
                  <div className="exercise-status">
                    {latestSession.completedSets >= latestSession.totalSets ? (
                      <span className="status-badge completed">✅ הושלם</span>
                    ) : (
                      <span className="status-badge partial">⚠️ חלקי</span>
                    )}
                  </div>
                </div>
                
                <div className="exercise-summary">
                  <div className="summary-item">
                    <span className="summary-label">סטים:</span>
                    <span className="summary-value">{latestSession.completedSets}/{latestSession.totalSets}</span>
                  </div>
                  <div className="summary-item">
                    <span className="summary-label">זמן:</span>
                    <span className="summary-value">{formatDateTime(latestSession.completedAt).split(' ')[1]}</span>
                  </div>
                  {latestSession.setsData && latestSession.setsData.length > 0 && (
                    <div className="summary-item">
                      <span className="summary-label">משקל:</span>
                      <span className="summary-value">
                        {latestSession.setsData[0]?.weight ? `${latestSession.setsData[0].weight} ק"ג` : '-'}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // Training list view (main view)
  return (
    <div className="training-history" dir="rtl">
      <div className="history-header">
        <button onClick={onBack} className="back-button">
          ← חזרה לניהול מתאמנים
        </button>
        <div className="header-content">
          <h1 className="page-title">
            <span className="title-icon">📊</span>
            היסטוריית אימונים - {trainee.firstName} {trainee.lastName}
          </h1>
        </div>
      </div>

      {trainingSessions.length === 0 ? (
        <div className="empty-history">
          <div className="empty-icon">🏋️</div>
          <h3>אין היסטוריית אימונים עדיין</h3>
          <p>המתאמן עדיין לא השלים אימונים</p>
        </div>
      ) : (
        <div className="trainings-list">
          {trainingSessions.map((training, index) => (
            <div 
              key={`${training.trainingType}-${training.date}`} 
              className="training-card clickable"
              onClick={() => handleTrainingClick(training)}
            >
              <div className="training-header">
                <h3 className="training-title">אימון {training.trainingType}</h3>
                <div className="training-date">{formatDate(training.date)}</div>
              </div>
              
              <div className="training-summary">
                <div className="summary-item">
                  <span className="summary-label">תרגילים:</span>
                  <span className="summary-value">{training.completedExercises} תרגילים</span>
                </div>
                <div className="summary-item">
                  <span className="summary-label">סה"כ סטים:</span>
                  <span className="summary-value">
                    {training.exercises.reduce((sum, ex) => sum + ex.completedSets, 0)} סטים
                  </span>
                </div>
              </div>

              <div className="training-exercises-preview">
                <div className="exercises-preview-list">
                  {getUniqueExercises(training.exercises).slice(0, 3).map(exerciseName => (
                    <span key={exerciseName} className="exercise-preview-tag">
                      {exerciseName}
                    </span>
                  ))}
                  {getUniqueExercises(training.exercises).length > 3 && (
                    <span className="exercise-preview-tag more">
                      +{getUniqueExercises(training.exercises).length - 3} עוד
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default TraineeTrainingHistory;
