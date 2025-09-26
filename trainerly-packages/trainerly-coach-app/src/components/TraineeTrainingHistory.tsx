import React, { useState, useEffect } from 'react';
import { cachedApiService, Trainee } from '../services/cachedApiService';
import { showError } from './ToastContainer';
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

interface ExerciseHistoryEntry {
  date: string;
  weight?: number;
  repeats?: number;
  restTime: number;
  completedSets: number;
  totalSets: number;
  setsData?: Array<{
    weight?: number;
    repeats?: number;
  }>;
}

interface TrainingGroup {
  trainingType: string;
  exercises: {
    [exerciseName: string]: ExerciseSession[];
  };
}

interface TraineeTrainingHistoryModalProps {
  trainee: Trainee;
  coachId: string;
  token: string;
  isOpen: boolean;
  onClose: () => void;
}

const TraineeTrainingHistoryModal: React.FC<TraineeTrainingHistoryModalProps> = ({
  trainee,
  coachId,
  token,
  isOpen,
  onClose
}) => {
  const [sessions, setSessions] = useState<ExerciseSession[]>([]);
  const [trainingGroups, setTrainingGroups] = useState<TrainingGroup[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedExercise, setSelectedExercise] = useState<string | null>(null);
  const [exerciseHistory, setExerciseHistory] = useState<ExerciseHistoryEntry[]>([]);

  useEffect(() => {
    if (isOpen && trainee) {
      loadTrainingHistory();
    }
  }, [isOpen, trainee?.trainerId]);

  const loadTrainingHistory = async () => {
    try {
      setLoading(true);
      
      // Force refresh to bypass cache - exercise sessions change frequently
      const sessionsResult = await cachedApiService.getTraineeExerciseSessions(
        coachId, 
        trainee.trainerId, 
        token, 
        200, // Get more sessions for comprehensive history
        { forceRefresh: true }
      );
      
      const allSessions = sessionsResult.data;
      setSessions(allSessions);
      
      // Group sessions by training type
      const groupedTrainings = groupSessionsByTrainingType(allSessions);
      setTrainingGroups(groupedTrainings);
      
      setError(null);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to load training history';
      setError(errorMsg);
      showError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const groupSessionsByTrainingType = (sessions: ExerciseSession[]): TrainingGroup[] => {
    // Group by training type
    const grouped: { [trainingType: string]: { [exerciseName: string]: ExerciseSession[] } } = {};
    
    sessions.forEach(session => {
      if (!grouped[session.trainingType]) {
        grouped[session.trainingType] = {};
      }
      
      if (!grouped[session.trainingType][session.exerciseName]) {
        grouped[session.trainingType][session.exerciseName] = [];
      }
      
      grouped[session.trainingType][session.exerciseName].push(session);
    });

    // Convert to TrainingGroup objects and sort training types
    const trainingGroups: TrainingGroup[] = Object.entries(grouped)
      .map(([trainingType, exercises]) => ({
        trainingType,
        exercises
      }))
      .sort((a, b) => a.trainingType.localeCompare(b.trainingType));

    return trainingGroups;
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
        day: '2-digit'
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

  const handleExerciseClick = (exerciseName: string) => {
    // Get all sessions for this exercise across all dates
    const exerciseSessions = sessions.filter(session => session.exerciseName === exerciseName);
    
    // Convert to history entries and sort by date (most recent first)
    const history: ExerciseHistoryEntry[] = exerciseSessions
      .map(session => ({
        date: session.completedAt,
        weight: session.setsData?.[0]?.weight,
        repeats: session.setsData?.[0]?.repeats,
        restTime: session.restTime || 0,
        completedSets: session.completedSets,
        totalSets: session.totalSets,
        setsData: session.setsData
      }))
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    
    setSelectedExercise(exerciseName);
    setExerciseHistory(history);
  };

  const handleBackToMain = () => {
    setSelectedExercise(null);
    setExerciseHistory([]);
  };

  if (!isOpen || !trainee) return null;

  return (
    <div className="modal-overlay">
      <div className="training-history-modal" dir="rtl">
        <div className="modal-header">
          <h2>נתוני אימונים - {trainee.nickname}</h2>
          <button onClick={onClose} className="close-button">✕</button>
        </div>
        
        <div className="modal-content">
          {loading ? (
            <div className="loading-container">
              <div className="loading-spinner"></div>
              <p>טוען נתוני אימונים...</p>
            </div>
          ) : error ? (
            <div className="error-container">
              <div className="error-icon">⚠️</div>
              <div className="error-text">שגיאה: {error}</div>
              <button onClick={loadTrainingHistory} className="retry-button">
                <span className="button-icon">🔄</span>
                נסה שוב
              </button>
            </div>
          ) : selectedExercise ? (
            // Exercise history view
            <div className="exercise-history-view">
              <div className="exercise-history-header">
                <button onClick={handleBackToMain} className="back-button">
                  ← חזרה לרשימה הכללית
                </button>
                <h3>היסטוריית {selectedExercise}</h3>
              </div>
              
              {exerciseHistory.length === 0 ? (
                <div className="no-history">
                  <p>אין היסטוריה עדיין לתרגיל זה</p>
                </div>
              ) : (
                <div className="history-list">
                  <div className="history-list-header">
                    <div className="history-col">תאריך</div>
                    <div className="history-col">משקל</div>
                    <div className="history-col">חזרות</div>
                    <div className="history-col">מנוחה</div>
                    <div className="history-col">סטים</div>
                  </div>
                  
                  {exerciseHistory.map((entry, index) => (
                    <div key={index} className="history-entry">
                      <div className="history-col">
                        {formatDate(entry.date)}
                      </div>
                      <div className="history-col">
                        {entry.weight ? `${entry.weight} ק"ג` : '-'}
                      </div>
                      <div className="history-col">
                        {entry.repeats ? entry.repeats : '-'}
                      </div>
                      <div className="history-col">
                        {formatRestTime(entry.restTime)}
                      </div>
                      <div className="history-col">
                        {entry.completedSets}/{entry.totalSets}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : trainingGroups.length === 0 ? (
            <div className="empty-history">
              <div className="empty-icon">🏋️</div>
              <h3>אין נתוני אימונים עדיין</h3>
              <p>המתאמן עדיין לא השלים אימונים</p>
            </div>
          ) : (
            // Main view with all trainings and exercises
            <div className="trainings-overview">
              {trainingGroups.map((group) => (
                <div key={group.trainingType} className="training-group">
                  <div className="training-group-header">
                    <h3>אימון {group.trainingType}</h3>
                  </div>
                  
                  <div className="exercises-grid">
                    {Object.entries(group.exercises).map(([exerciseName, exerciseSessions]) => {
                      const sessionCount = exerciseSessions.length;
                      const lastSession = exerciseSessions.sort((a, b) => 
                        new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime()
                      )[0];
                      
                      return (
                        <div 
                          key={exerciseName} 
                          className="exercise-summary-card"
                          onClick={() => handleExerciseClick(exerciseName)}
                        >
                          <div className="exercise-card-header">
                            <h4>{exerciseName}</h4>
                            <span className="session-count">{sessionCount} פעמים</span>
                          </div>
                          
                          <div className="exercise-card-details">
                            <div className="last-workout">
                              <span className="detail-label">אחרון:</span>
                              <span className="detail-value">{formatDate(lastSession.completedAt)}</span>
                            </div>
                            {lastSession.setsData?.[0]?.weight && (
                              <div className="last-weight">
                                <span className="detail-label">משקל:</span>
                                <span className="detail-value">{lastSession.setsData[0].weight} ק"ג</span>
                              </div>
                            )}
                            {lastSession.setsData?.[0]?.repeats && (
                              <div className="last-repeats">
                                <span className="detail-label">חזרות:</span>
                                <span className="detail-value">{lastSession.setsData[0].repeats}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TraineeTrainingHistoryModal;
