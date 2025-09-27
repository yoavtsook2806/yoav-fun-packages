import React, { useState } from 'react';
import { PrescribedExercise } from '../services/apiService';
import { Modal } from 'trainerly-ui-components';
import './TrainingExercises.css';

interface TrainingExercisesProps {
  exercises: PrescribedExercise[];
  onExerciseUpdate: (exerciseId: string, updates: Partial<PrescribedExercise>) => void;
  onExerciseRemove: (exerciseId: string) => void;
  title?: string;
}

interface ExerciseEditData {
  numberOfSets: number;
  minimumTimeToRest: number;
  maximumTimeToRest: number;
  minimumNumberOfRepeasts: number;
  maximumNumberOfRepeasts: number;
  note: string;
}

const TrainingExercises: React.FC<TrainingExercisesProps> = ({
  exercises,
  onExerciseUpdate,
  onExerciseRemove,
  title = "תרגילי האימון"
}) => {
  const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set());
  const [editingExercise, setEditingExercise] = useState<PrescribedExercise | null>(null);
  const [editData, setEditData] = useState<ExerciseEditData>({
    numberOfSets: 3,
    minimumTimeToRest: 60,
    maximumTimeToRest: 120,
    minimumNumberOfRepeasts: 8,
    maximumNumberOfRepeasts: 12,
    note: ''
  });

  const toggleCardExpansion = (exerciseId: string) => {
    const newExpandedCards = new Set(expandedCards);
    if (expandedCards.has(exerciseId)) {
      newExpandedCards.delete(exerciseId);
    } else {
      newExpandedCards.add(exerciseId);
    }
    setExpandedCards(newExpandedCards);
  };

  const handleEditExercise = (exercise: PrescribedExercise) => {
    setEditingExercise(exercise);
    setEditData({
      numberOfSets: exercise.numberOfSets || 3,
      minimumTimeToRest: exercise.minimumTimeToRest || 60,
      maximumTimeToRest: exercise.maximumTimeToRest || 120,
      minimumNumberOfRepeasts: exercise.minimumNumberOfRepeasts || 8,
      maximumNumberOfRepeasts: exercise.maximumNumberOfRepeasts || 12,
      note: exercise.note || ''
    });
  };

  const handleSaveExercise = () => {
    if (!editingExercise) return;

    onExerciseUpdate(editingExercise.exerciseId, {
      numberOfSets: editData.numberOfSets,
      minimumTimeToRest: editData.minimumTimeToRest,
      maximumTimeToRest: editData.maximumTimeToRest,
      minimumNumberOfRepeasts: editData.minimumNumberOfRepeasts,
      maximumNumberOfRepeasts: editData.maximumNumberOfRepeasts,
      note: editData.note
    });

    setEditingExercise(null);
  };

  const handleCancelEdit = () => {
    setEditingExercise(null);
  };

  const renderTrainingExerciseCard = (exercise: PrescribedExercise) => {
    const isExpanded = expandedCards.has(exercise.exerciseId);

    return (
      <div 
        key={exercise.exerciseId} 
        className={`training-exercise-card ${isExpanded ? 'expanded' : 'collapsed'}`}
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
              <div className="exercise-summary">
                <span className="summary-item">🎯 {exercise.muscleGroup}</span>
                <span className="summary-item">🔢 {exercise.numberOfSets || 3} סטים</span>
                <span className="summary-item">
                  🔁 {exercise.minimumNumberOfRepeasts || 8}-{exercise.maximumNumberOfRepeasts || 12} חזרות
                </span>
              </div>
            )}
          </div>
          <div className="card-actions-compact">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onExerciseRemove(exercise.exerciseId);
              }}
              className="remove-btn-compact"
              title="הסר תרגיל"
            >
              ✕
            </button>
          </div>
        </div>

        {isExpanded && (
          <div className="card-details">
            <div className="exercise-meta">
              <p className="card-subtitle">🎯 {exercise.muscleGroup}</p>
            </div>

            <div className="training-parameters">
              <div className="parameter-row">
                <div className="parameter-item">
                  <span className="parameter-label">🔢 מספר סטים:</span>
                  <span className="parameter-value">{exercise.numberOfSets || 3}</span>
                </div>
                <div className="parameter-item">
                  <span className="parameter-label">⏱️ זמן מנוחה:</span>
                  <span className="parameter-value">
                    {exercise.minimumTimeToRest || 60}-{exercise.maximumTimeToRest || 120} שניות
                  </span>
                </div>
              </div>
              <div className="parameter-row">
                <div className="parameter-item">
                  <span className="parameter-label">🔁 חזרות:</span>
                  <span className="parameter-value">
                    {exercise.minimumNumberOfRepeasts || 8}-{exercise.maximumNumberOfRepeasts || 12}
                  </span>
                </div>
              </div>
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
                  handleEditExercise(exercise);
                }}
                className="btn-secondary btn-sm"
              >
                <span className="btn-icon">⚙️</span>
                ערוך פרמטרים
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onExerciseRemove(exercise.exerciseId);
                }}
                className="btn-danger btn-sm"
              >
                <span className="btn-icon">🗑️</span>
                הסר תרגיל
              </button>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="training-exercises">
      <div className="training-exercises-header">
        <h3 className="section-title">
          <span className="section-icon">🏋️</span>
          {title}
        </h3>
        <div className="exercises-count">
          {exercises.length} תרגילים
        </div>
      </div>

      {exercises.length === 0 ? (
        <div className="empty-state">
          <span className="empty-icon">🏋️</span>
          <p>לא נבחרו תרגילים עדיין</p>
          <p className="empty-subtitle">בחר תרגילים מהרשימה למעלה כדי להוסיף אותם לאימון</p>
        </div>
      ) : (
        <div className="training-exercises-content">
          <div className="training-exercises-list">
            {exercises.map((exercise) => (
              <div key={exercise.exerciseId}>
                {renderTrainingExerciseCard(exercise)}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Exercise Parameters Edit Modal */}
      <Modal
        isOpen={!!editingExercise}
        onClose={handleCancelEdit}
        title="עריכת פרמטרי תרגיל"
        size="md"
      >
        {editingExercise && (
          <div className="exercise-edit-form">
            <div className="exercise-info-header">
              <h4>{editingExercise.name}</h4>
              <p className="exercise-muscle-group">🎯 {editingExercise.muscleGroup}</p>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>מספר סטים *</label>
                <input
                  type="number"
                  min="1"
                  max="10"
                  value={editData.numberOfSets}
                  onChange={(e) => setEditData(prev => ({ 
                    ...prev, 
                    numberOfSets: parseInt(e.target.value) || 1 
                  }))}
                  required
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>מינימום חזרות *</label>
                <input
                  type="number"
                  min="1"
                  max="50"
                  value={editData.minimumNumberOfRepeasts}
                  onChange={(e) => setEditData(prev => ({ 
                    ...prev, 
                    minimumNumberOfRepeasts: parseInt(e.target.value) || 1 
                  }))}
                  required
                />
              </div>
              <div className="form-group">
                <label>מקסימום חזרות *</label>
                <input
                  type="number"
                  min="1"
                  max="50"
                  value={editData.maximumNumberOfRepeasts}
                  onChange={(e) => setEditData(prev => ({ 
                    ...prev, 
                    maximumNumberOfRepeasts: parseInt(e.target.value) || 1 
                  }))}
                  required
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>מינימום זמן מנוחה (שניות) *</label>
                <input
                  type="number"
                  min="10"
                  max="600"
                  value={editData.minimumTimeToRest}
                  onChange={(e) => setEditData(prev => ({ 
                    ...prev, 
                    minimumTimeToRest: parseInt(e.target.value) || 10 
                  }))}
                  required
                />
              </div>
              <div className="form-group">
                <label>מקסימום זמן מנוחה (שניות) *</label>
                <input
                  type="number"
                  min="10"
                  max="600"
                  value={editData.maximumTimeToRest}
                  onChange={(e) => setEditData(prev => ({ 
                    ...prev, 
                    maximumTimeToRest: parseInt(e.target.value) || 10 
                  }))}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label>הוראות נוספות</label>
              <textarea
                value={editData.note}
                onChange={(e) => setEditData(prev => ({ ...prev, note: e.target.value }))}
                placeholder="הוראות מיוחדות לתרגיל זה באימון..."
                rows={3}
              />
            </div>

            <div className="button-group justify-end">
              <button
                type="button"
                onClick={handleSaveExercise}
                className="btn-primary"
              >
                <span className="btn-icon">💾</span>
                שמור שינויים
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default TrainingExercises;
