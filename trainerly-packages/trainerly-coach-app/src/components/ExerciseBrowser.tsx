import React, { useState } from 'react';
import { Exercise } from '../services/apiService';
import ExerciseGroupView from './ExerciseGroupView';
import './ExerciseBrowser.css';

interface ExerciseBrowserProps {
  exercises: Exercise[];
  onExerciseSelect: (exercise: Exercise) => void;
  selectedExercises: Exercise[];
  title?: string;
}

const ExerciseBrowser: React.FC<ExerciseBrowserProps> = ({
  exercises,
  onExerciseSelect,
  selectedExercises,
  title = "התרגילים שלי"
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set());

  // Filter exercises based on search term
  const filteredExercises = exercises.filter(exercise =>
    exercise.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    exercise.muscleGroup.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (exercise.note && exercise.note.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const toggleCardExpansion = (exerciseId: string) => {
    const newExpandedCards = new Set(expandedCards);
    if (expandedCards.has(exerciseId)) {
      newExpandedCards.delete(exerciseId);
    } else {
      newExpandedCards.add(exerciseId);
    }
    setExpandedCards(newExpandedCards);
  };

  const isExerciseSelected = (exercise: Exercise) => {
    return selectedExercises.some(selected => selected.exerciseId === exercise.exerciseId);
  };

  const renderExerciseCard = (exercise: Exercise) => {
    const isExpanded = expandedCards.has(exercise.exerciseId);
    const isSelected = isExerciseSelected(exercise);

    return (
      <div 
        key={exercise.exerciseId} 
        className={`exercise-browser-card ${isExpanded ? 'expanded' : 'collapsed'} ${isSelected ? 'selected' : ''}`}
      >
        <div
          className="card-header clickable"
          onClick={() => toggleCardExpansion(exercise.exerciseId)}
        >
          <div className="card-controls">
            <span className="expand-icon">{isExpanded ? '▼' : '◀'}</span>
          </div>
          <div className="exercise-info">
            <h4 className="card-title">{exercise.name}</h4>
            {!isExpanded && (
              <p className="card-subtitle">🎯 {exercise.muscleGroup}</p>
            )}
          </div>
          {isSelected && (
            <div className="selected-indicator">
              <span className="selected-icon">✅</span>
              <span className="selected-text">נבחר</span>
            </div>
          )}
        </div>

        {isExpanded && (
          <div className="card-details">
            <div className="exercise-meta">
              <p className="card-subtitle">🎯 {exercise.muscleGroup}</p>
            </div>

            {exercise.note && (
              <div className="card-content">
                <h5>הוראות ביצוע:</h5>
                <p>{exercise.note}</p>
              </div>
            )}

            {exercise.link && (
              <div className="card-footer">
                <a 
                  href={exercise.link} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="video-link"
                  onClick={(e) => e.stopPropagation()}
                >
                  🎥 צפה בסרטון
                </a>
              </div>
            )}

            <div className="card-actions-section">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onExerciseSelect(exercise);
                }}
                className={`btn-primary btn-sm ${isSelected ? 'selected' : ''}`}
                disabled={isSelected}
              >
                {isSelected ? (
                  <>
                    <span className="btn-icon">✅</span>
                    נבחר
                  </>
                ) : (
                  <>
                    <span className="btn-icon">➕</span>
                    הוסף לאימון
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="exercise-browser">
      <div className="exercise-browser-header">
        <h3 className="section-title">
          <span className="section-icon">💪</span>
          {title}
        </h3>
        <div className="exercise-search">
          <input
            type="text"
            placeholder="חפש תרגיל..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
          <span className="search-icon">🔍</span>
        </div>
      </div>

      {filteredExercises.length === 0 ? (
        <div className="empty-state">
          {searchTerm ? (
            <>
              <span className="empty-icon">🔍</span>
              <p>לא נמצאו תרגילים התואמים לחיפוש "{searchTerm}"</p>
            </>
          ) : (
            <>
              <span className="empty-icon">💪</span>
              <p>אין תרגילים זמינים</p>
              <p className="empty-subtitle">צור תרגילים חדשים בעמוד ניהול התרגילים</p>
            </>
          )}
        </div>
      ) : (
        <div className="exercise-browser-content">
          <ExerciseGroupView
            exercises={filteredExercises}
            renderExerciseCard={renderExerciseCard}
          />
        </div>
      )}
    </div>
  );
};

export default ExerciseBrowser;
