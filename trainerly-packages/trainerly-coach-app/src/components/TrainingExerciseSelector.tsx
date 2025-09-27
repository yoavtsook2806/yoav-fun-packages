import React, { useState } from 'react';
import { Exercise, PrescribedExercise } from '../services/apiService';
import { Card, Modal, ExerciseGroupView } from 'trainerly-ui-components';
import { MuscleGroupSelect } from 'trainerly-ui-components';
import ExerciseParameterModal, { ExerciseParameters } from './ExerciseParameterModal';
import './TrainingExerciseSelector.css';
import './ExerciseGroupView.css';

interface TrainingExerciseSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  exercises: Exercise[];
  trainingExercises: PrescribedExercise[];
  onExerciseAdd: (exercise: Exercise) => void;
  onExerciseUpdate: (exerciseId: string, updates: Partial<PrescribedExercise>) => void;
  onExerciseRemove: (exerciseId: string) => void;
  onSave?: () => void;
  trainingName?: string;
}

const TrainingExerciseSelector: React.FC<TrainingExerciseSelectorProps> = ({
  isOpen,
  onClose,
  exercises,
  trainingExercises,
  onExerciseAdd,
  onExerciseUpdate,
  onExerciseRemove,
  onSave,
  trainingName
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [muscleGroupFilter, setMuscleGroupFilter] = useState('');
  const [expandedExerciseCards, setExpandedExerciseCards] = useState<Set<string>>(new Set());
  const [expandedTrainingCards, setExpandedTrainingCards] = useState<Set<string>>(new Set());
  const [showParameterModal, setShowParameterModal] = useState(false);
  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(null);
  const [editingTrainingExercise, setEditingTrainingExercise] = useState<PrescribedExercise | null>(null);

  // Filter exercises based on search term and muscle group
  const filteredExercises = exercises.filter(exercise => {
    const matchesSearch = !searchTerm || 
      exercise.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (exercise.muscleGroup && exercise.muscleGroup.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (exercise.note && exercise.note.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesMuscleGroup = !muscleGroupFilter || exercise.muscleGroup === muscleGroupFilter;
    
    return matchesSearch && matchesMuscleGroup;
  });

  const toggleExerciseCard = (exerciseId: string) => {
    const newExpandedCards = new Set(expandedExerciseCards);
    if (expandedExerciseCards.has(exerciseId)) {
      newExpandedCards.delete(exerciseId);
    } else {
      newExpandedCards.add(exerciseId);
    }
    setExpandedExerciseCards(newExpandedCards);
  };

  const toggleTrainingCard = (exerciseId: string) => {
    const newExpandedCards = new Set(expandedTrainingCards);
    if (expandedTrainingCards.has(exerciseId)) {
      newExpandedCards.delete(exerciseId);
    } else {
      newExpandedCards.add(exerciseId);
    }
    setExpandedTrainingCards(newExpandedCards);
  };

  const isExerciseSelected = (exercise: Exercise) => {
    return trainingExercises.some(selected => selected.exerciseId === exercise.exerciseId);
  };

  const handleExerciseSelect = (exercise: Exercise) => {
    if (isExerciseSelected(exercise)) return;
    setSelectedExercise(exercise);
    setShowParameterModal(true);
  };

  const handleParameterSave = (parameters: ExerciseParameters) => {
    if (!selectedExercise) return;
    
    // Create prescribed exercise with parameters
    const prescribedExercise: PrescribedExercise = {
      exerciseId: selectedExercise.exerciseId,
      exerciseName: selectedExercise.name,
      name: selectedExercise.name,
      muscleGroup: selectedExercise.muscleGroup,
      link: selectedExercise.link,
      note: selectedExercise.note,
      ...parameters
    };
    
    onExerciseAdd(selectedExercise);
    setSelectedExercise(null);
  };

  const handleTrainingExerciseEdit = (exercise: PrescribedExercise) => {
    setEditingTrainingExercise(exercise);
    setSelectedExercise({
      exerciseId: exercise.exerciseId,
      name: exercise.name,
      muscleGroup: exercise.muscleGroup,
      link: exercise.link,
      note: exercise.note,
      coachId: '', // Not needed for editing
      createdAt: '' // Not needed for editing
    });
    setShowParameterModal(true);
  };

  const handleTrainingParameterSave = (parameters: ExerciseParameters) => {
    if (!editingTrainingExercise) return;
    
    onExerciseUpdate(editingTrainingExercise.exerciseId, parameters);
    setEditingTrainingExercise(null);
    setSelectedExercise(null);
  };

  const renderExerciseCard = (exercise: Exercise) => {
    const isExpanded = expandedExerciseCards.has(exercise.exerciseId);
    const isSelected = isExerciseSelected(exercise);

    return (
      <Card 
        key={exercise.exerciseId} 
        data-id={exercise.exerciseId} 
        className={`${isExpanded ? 'expanded' : 'collapsed'} ${isSelected ? 'selected' : ''}`}
      >
        <div
          className="card-header clickable"
          onClick={() => toggleExerciseCard(exercise.exerciseId)}
        >
          <div className="card-controls">
            <span className="expand-icon">{isExpanded ? '▼' : '▲'}</span>
          </div>
          <div className="exercise-info">
            <h3 className="card-title">{exercise.name}</h3>
            {!isExpanded && exercise.muscleGroup && (
              <p className="card-subtitle">{exercise.muscleGroup}</p>
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
            {exercise.muscleGroup && (
              <p className="card-subtitle">🎯 {exercise.muscleGroup}</p>
            )}

            {exercise.note && (
              <div className="card-content">
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
                  handleExerciseSelect(exercise);
                }}
                className={`btn-primary btn-sm ${isSelected ? 'selected' : ''}`}
                disabled={isSelected}
                title={isSelected ? 'תרגיל נבחר' : 'הוסף לאימון'}
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
      </Card>
    );
  };

  const renderTrainingExerciseCard = (exercise: PrescribedExercise) => {
    const isExpanded = expandedTrainingCards.has(exercise.exerciseId);

    return (
      <Card 
        key={exercise.exerciseId} 
        data-id={exercise.exerciseId} 
        className={isExpanded ? 'expanded' : 'collapsed'}
      >
        <div
          className="card-header clickable"
          onClick={() => toggleTrainingCard(exercise.exerciseId)}
        >
          <div className="card-controls">
            <span className="expand-icon">{isExpanded ? '▼' : '▲'}</span>
          </div>
          <div className="exercise-info">
            <h3 className="card-title">{exercise.name}</h3>
            {!isExpanded && (
              <p className="card-subtitle">
                🎯 {exercise.muscleGroup} • 🔢 {exercise.numberOfSets || 3} סטים • 🔁 {exercise.minimumNumberOfRepeasts || 8}-{exercise.maximumNumberOfRepeasts || 12} חזרות
              </p>
            )}
          </div>
        </div>

        {isExpanded && (
          <div className="card-details">
            {exercise.muscleGroup && (
              <p className="card-subtitle">🎯 {exercise.muscleGroup}</p>
            )}

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
                <p>{exercise.note}</p>
              </div>
            )}

            {exercise.prescriptionNote && (
              <div className="card-content">
                <h5>הוראות לאימון:</h5>
                <p>{exercise.prescriptionNote}</p>
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
                  handleTrainingExerciseEdit(exercise);
                }}
                className="btn-secondary btn-sm"
                title="ערוך פרמטרים"
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
                title="הסר תרגיל"
              >
                <span className="btn-icon">🗑️</span>
                הסר תרגיל
              </button>
            </div>
          </div>
        )}
      </Card>
    );
  };

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title={trainingName ? `עריכת אימון: ${trainingName}` : "ניהול תרגילים"}
        size="xl"
      >
        <div className="training-exercise-selector">
          {/* Top Section: Exercise Browser */}
          <div className="exercise-browser-section">
            <div className="section-header">
              <h3 className="section-title">
                <span className="section-icon">💪</span>
                התרגילים שלי
              </h3>
              
              <div className="search-section">
                <div className="search-filters">
                  <input
                    type="text"
                    placeholder="חפש תרגיל..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="search-input"
                    dir="rtl"
                  />
                  <div className="muscle-group-filter">
                    <MuscleGroupSelect
                      value={muscleGroupFilter}
                      onChange={setMuscleGroupFilter}
                      placeholder="סנן לפי קבוצת שרירים..."
                      className="filter-select"
                    />
                  </div>
                  {(searchTerm || muscleGroupFilter) && (
                    <button
                      type="button"
                      onClick={() => {
                        setSearchTerm('');
                        setMuscleGroupFilter('');
                      }}
                      className="clear-filters-btn"
                      title="נקה מסננים"
                    >
                      ✕
                    </button>
                  )}
                </div>
              </div>
            </div>

            <div className="exercises-content">
              {filteredExercises.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-icon">💪</div>
                  <h3>{searchTerm || muscleGroupFilter ? 'לא נמצאו תרגילים' : 'אין תרגילים זמינים'}</h3>
                  <p>{searchTerm || muscleGroupFilter ? 'נסה מילות חיפוש אחרות' : 'צור תרגילים חדשים בעמוד ניהול התרגילים'}</p>
                </div>
              ) : (
                <ExerciseGroupView
                  exercises={filteredExercises}
                  renderExerciseCard={renderExerciseCard}
                />
              )}
            </div>
          </div>

          {/* Divider */}
          <div className="sections-divider">
            <div className="divider-line"></div>
            <div className="divider-icon">⬇️</div>
            <div className="divider-line"></div>
          </div>

          {/* Bottom Section: Training Exercises */}
          <div className="training-exercises-section">
            <div className="section-header">
              <h3 className="section-title">
                <span className="section-icon">🏋️</span>
                תרגילי האימון
              </h3>
              <div className="exercises-count">
                {trainingExercises.length} תרגילים
              </div>
            </div>

            <div className="training-exercises-content">
              {trainingExercises.length === 0 ? (
                <div className="empty-state">
                  <span className="empty-icon">🏋️</span>
                  <p>לא נבחרו תרגילים עדיין</p>
                  <p className="empty-subtitle">בחר תרגילים מהרשימה למעלה כדי להוסיף אותם לאימון</p>
                </div>
              ) : (
                <ExerciseGroupView
                  exercises={trainingExercises}
                  renderExerciseCard={renderTrainingExerciseCard}
                />
              )}
            </div>
          </div>

          {/* Save Button */}
          {onSave && (
            <div className="modal-actions">
              <button
                type="button"
                onClick={onSave}
                className="btn-primary"
                disabled={trainingExercises.length === 0}
              >
                <span className="btn-icon">💾</span>
                שמור אימון
              </button>
            </div>
          )}
        </div>
      </Modal>

      {/* Exercise Parameter Modal */}
      <ExerciseParameterModal
        isOpen={showParameterModal}
        onClose={() => {
          setShowParameterModal(false);
          setSelectedExercise(null);
          setEditingTrainingExercise(null);
        }}
        exercise={selectedExercise}
        onSave={editingTrainingExercise ? handleTrainingParameterSave : handleParameterSave}
        initialParameters={editingTrainingExercise ? {
          numberOfSets: editingTrainingExercise.numberOfSets || 3,
          minimumTimeToRest: editingTrainingExercise.minimumTimeToRest || 60,
          maximumTimeToRest: editingTrainingExercise.maximumTimeToRest || 120,
          minimumNumberOfRepeasts: editingTrainingExercise.minimumNumberOfRepeasts || 8,
          maximumNumberOfRepeasts: editingTrainingExercise.maximumNumberOfRepeasts || 12,
          prescriptionNote: editingTrainingExercise.prescriptionNote || ''
        } : undefined}
      />
    </>
  );
};

export default TrainingExerciseSelector;
