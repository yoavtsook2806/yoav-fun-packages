import React, { useState } from 'react';
import { getExerciseHistory } from '../utils/exerciseHistory';
import { ExerciseHistoryEntry } from '../types';
import ExerciseModal from './ExerciseModal';
import ExercisePerformanceGraph from './ExercisePerformanceGraph';

interface ExerciseHistoryProps {
  exerciseName: string;
  onClose: () => void;
}

const ExerciseHistory: React.FC<ExerciseHistoryProps> = ({
  exerciseName,
  onClose,
}) => {
  const history = getExerciseHistory();
  const exerciseHistory = history[exerciseName] || [];
  const [selectedEntry, setSelectedEntry] = useState<ExerciseHistoryEntry | null>(null);
  const [activeTab, setActiveTab] = useState<'history' | 'graph'>('history');

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('he-IL', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('he-IL', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatRestTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };


  const handleBackToList = () => {
    setSelectedEntry(null);
  };

  const handleEntryClick = (entry: ExerciseHistoryEntry) => {
    setSelectedEntry(entry);
  };

  // Detailed view for selected entry
  if (selectedEntry) {
    return (
      <ExerciseModal
        exerciseName={exerciseName}
        title="פרטי אימון"
        onClose={onClose}
        onBack={handleBackToList}
      >
        <div className="detailed-history-view">
          <div className="detailed-date">
            {formatDateTime(selectedEntry.date)}
          </div>

          <div className="workout-summary">
            {selectedEntry.setsData && selectedEntry.setsData.length > 0 && (() => {
              const firstSet = selectedEntry.setsData[0];
              const targetWeight = firstSet?.weight || selectedEntry.weight;
              const targetRepeats = firstSet?.repeats || selectedEntry.repeats;
              
              const successfulSets = selectedEntry.setsData.filter(setData => {
                const weightSuccess = !targetWeight || !setData.weight || setData.weight >= targetWeight;
                const repeatsSuccess = !targetRepeats || !setData.repeats || setData.repeats >= targetRepeats;
                return weightSuccess && repeatsSuccess;
              }).length;
              
              return (
                <div className="summary-item">
                  <span className="summary-label">סטים מוצלחים:</span>
                  <span className={`summary-value ${successfulSets === selectedEntry.completedSets ? 'success' : 'warning'}`}>
                    {successfulSets}/{selectedEntry.completedSets}
                  </span>
                </div>
              );
            })()}
            <div className="summary-item">
              <span className="summary-label">זמן מנוחה:</span>
              <span className="summary-value">{formatRestTime(selectedEntry.restTime)}</span>
            </div>
          </div>

          {selectedEntry.setsData && selectedEntry.setsData.length > 0 ? (
            <div className="sets-details">
              <h4>פירוט סטים:</h4>
              <div className="sets-grid">
                {selectedEntry.setsData?.map((setData, index) => {
                  // Get the target values from the first set of this specific workout
                  const firstSet = selectedEntry.setsData?.[0];
                  const targetWeight = firstSet?.weight || selectedEntry.weight;
                  const targetRepeats = firstSet?.repeats || selectedEntry.repeats;

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
              {selectedEntry.weight && (
                <div className="legacy-data">
                  <span>משקל: {selectedEntry.weight} ק"ג</span>
                </div>
              )}
              {selectedEntry.repeats && (
                <div className="legacy-data">
                  <span>חזרות: {selectedEntry.repeats}</span>
                </div>
              )}
            </div>
          )}
        </div>
      </ExerciseModal>
    );
  }

  // Main tabbed view
  return (
    <ExerciseModal
      exerciseName={exerciseName}
      title="היסטוריית תרגיל"
      onClose={onClose}
    >
      {exerciseHistory.length === 0 ? (
        <div className="no-history">
          <p>אין היסטוריה עדיין לתרגיל זה</p>
          <p>השלם את התרגיל כדי לראות את ההיסטוריה כאן</p>
        </div>
      ) : (
        <div className="history-tabs-container">
          {/* Tab Navigation */}
          <div className="history-tabs">
            <button 
              className={`history-tab ${activeTab === 'history' ? 'active' : ''}`}
              onClick={() => setActiveTab('history')}
            >
              📋 רשימה
            </button>
            <button 
              className={`history-tab ${activeTab === 'graph' ? 'active' : ''}`}
              onClick={() => setActiveTab('graph')}
            >
              📊 גרף
            </button>
          </div>

          {/* Tab Content */}
          <div className="history-tab-content">
            {activeTab === 'history' ? (
              <div className="modern-history-list">
                {exerciseHistory.length === 0 ? (
                  <div className="no-history-message">
                    <div className="no-history-icon">📊</div>
                    <h3>אין היסטוריית אימונים</h3>
                    <p>התחל להתאמן כדי לראות את ההיסטוריה שלך כאן</p>
                  </div>
                ) : (
                  exerciseHistory.map((entry, index) => (
                    <div 
                      key={index} 
                      className="modern-history-card"
                      onClick={() => handleEntryClick(entry)}
                    >
                      <div className="history-card-header">
                        <div className="history-date">
                          <span className="date-text">{formatDate(entry.date)}</span>
                          <span className="date-day">{formatDateTime(entry.date).split(',')[0]}</span>
                        </div>
                        <div className="history-arrow">
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                            <path d="M8 4L16 12L8 20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        </div>
                      </div>
                      
                      <div className="history-card-stats">
                        <div className="history-stat">
                          <div className="stat-icon">🏋️</div>
                          <div className="stat-info">
                            <span className="stat-label">משקל</span>
                            <span className="stat-value">{entry.weight ? `${entry.weight} ק"ג` : 'לא נרשם'}</span>
                          </div>
                        </div>
                        
                        <div className="history-stat">
                          <div className="stat-icon">🔢</div>
                          <div className="stat-info">
                            <span className="stat-label">חזרות</span>
                            <span className="stat-value">{entry.repeats ? entry.repeats : 'לא נרשם'}</span>
                          </div>
                        </div>
                        
                        <div className="history-stat">
                          <div className="stat-icon">⏱️</div>
                          <div className="stat-info">
                            <span className="stat-label">מנוחה</span>
                            <span className="stat-value">{formatRestTime(entry.restTime)}</span>
                          </div>
                        </div>
                        
                        {entry.setsData && entry.setsData.length > 0 && (
                          <div className="history-stat">
                            <div className="stat-icon">📊</div>
                            <div className="stat-info">
                              <span className="stat-label">סטים</span>
                              <span className="stat-value">{entry.setsData.length} סטים</span>
                            </div>
                          </div>
                        )}
                      </div>
                      
                      <div className="history-card-footer">
                        <span className="click-hint">לחץ לפירוט מלא</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            ) : (
              <ExercisePerformanceGraph 
                exerciseName={exerciseName}
                exerciseHistory={exerciseHistory}
              />
            )}
          </div>
        </div>
      )}
    </ExerciseModal>
  );
};

export default ExerciseHistory;
