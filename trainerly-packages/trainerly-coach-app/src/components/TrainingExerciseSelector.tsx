import React, { useState, useEffect } from 'react';
import { Exercise, PrescribedExercise } from '../services/apiService';
import Modal from './Modal';
import MuscleGroupSelect from './MuscleGroupSelect';
import './TrainingExerciseSelector.css';

interface TrainingExerciseSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  exercises: Exercise[];
  trainingExercises: PrescribedExercise[];
  onExerciseAdd: (exercise: Exercise) => void;
  onExerciseUpdate: (exerciseId: string, updates: Partial<PrescribedExercise>) => void;
  onExerciseRemove: (exerciseId: string) => void;
}

interface MuscleGroupData {
  name: string;
  exercises: Exercise[];
  count: number;
}

interface TrainingMuscleGroupData {
  name: string;
  exercises: PrescribedExercise[];
  count: number;
}

interface ExerciseEditData {
  numberOfSets: number;
  minimumTimeToRest: number;
  maximumTimeToRest: number;
  minimumNumberOfRepeasts: number;
  maximumNumberOfRepeasts: number;
  prescriptionNote: string;
}

const TrainingExerciseSelector: React.FC<TrainingExerciseSelectorProps> = ({
  isOpen,
  onClose,
  exercises,
  trainingExercises,
  onExerciseAdd,
  onExerciseUpdate,
  onExerciseRemove
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [muscleGroupFilter, setMuscleGroupFilter] = useState('');
  const [expandedExerciseGroups, setExpandedExerciseGroups] = useState<Set<string>>(new Set());
  const [expandedTrainingGroups, setExpandedTrainingGroups] = useState<Set<string>>(new Set());
  const [expandedExerciseCards, setExpandedExerciseCards] = useState<Set<string>>(new Set());
  const [expandedTrainingCards, setExpandedTrainingCards] = useState<Set<string>>(new Set());
  const [editingExercise, setEditingExercise] = useState<PrescribedExercise | null>(null);
  const [editData, setEditData] = useState<ExerciseEditData>({
    numberOfSets: 3,
    minimumTimeToRest: 60,
    maximumTimeToRest: 120,
    minimumNumberOfRepeasts: 8,
    maximumNumberOfRepeasts: 12,
    prescriptionNote: ''
  });

  // Filter exercises based on search term and muscle group
  const filteredExercises = exercises.filter(exercise => {
    const matchesSearch = !searchTerm || 
      exercise.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (exercise.muscleGroup && exercise.muscleGroup.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (exercise.note && exercise.note.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesMuscleGroup = !muscleGroupFilter || exercise.muscleGroup === muscleGroupFilter;
    
    return matchesSearch && matchesMuscleGroup;
  });

  // Group exercises by muscle group
  const exerciseMuscleGroups: MuscleGroupData[] = filteredExercises.reduce((groups, exercise) => {
    const muscleGroup = exercise.muscleGroup || 'לא מוגדר';
    const existingGroup = groups.find(g => g.name === muscleGroup);
    
    if (existingGroup) {
      existingGroup.exercises.push(exercise);
      existingGroup.count++;
    } else {
      groups.push({
        name: muscleGroup,
        exercises: [exercise],
        count: 1
      });
    }
    
    return groups;
  }, [] as MuscleGroupData[])
  .sort((a, b) => a.name.localeCompare(b.name, 'he'));

  // Group training exercises by muscle group
  const trainingMuscleGroups: TrainingMuscleGroupData[] = trainingExercises.reduce((groups, exercise) => {
    const muscleGroup = exercise.muscleGroup || 'לא מוגדר';
    const existingGroup = groups.find(g => g.name === muscleGroup);
    
    if (existingGroup) {
      existingGroup.exercises.push(exercise);
      existingGroup.count++;
    } else {
      groups.push({
        name: muscleGroup,
        exercises: [exercise],
        count: 1
      });
    }
    
    return groups;
  }, [] as TrainingMuscleGroupData[])
  .sort((a, b) => a.name.localeCompare(b.name, 'he'));

  const toggleExerciseGroup = (groupName: string) => {
    const newExpandedGroups = new Set(expandedExerciseGroups);
    if (expandedExerciseGroups.has(groupName)) {
      newExpandedGroups.delete(groupName);
    } else {
      newExpandedGroups.add(groupName);
    }
    setExpandedExerciseGroups(newExpandedGroups);
  };

  const toggleTrainingGroup = (groupName: string) => {
    const newExpandedGroups = new Set(expandedTrainingGroups);
    if (expandedTrainingGroups.has(groupName)) {
      newExpandedGroups.delete(groupName);
    } else {
      newExpandedGroups.add(groupName);
    }
    setExpandedTrainingGroups(newExpandedGroups);
  };

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

  const handleEditExercise = (exercise: PrescribedExercise) => {
    setEditingExercise(exercise);
    setEditData({
      numberOfSets: exercise.numberOfSets || 3,
      minimumTimeToRest: exercise.minimumTimeToRest || 60,
      maximumTimeToRest: exercise.maximumTimeToRest || 120,
      minimumNumberOfRepeasts: exercise.minimumNumberOfRepeasts || 8,
      maximumNumberOfRepeasts: exercise.maximumNumberOfRepeasts || 12,
      prescriptionNote: exercise.prescriptionNote || ''
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
      prescriptionNote: editData.prescriptionNote
    });

    setEditingExercise(null);
  };

  const handleCancelEdit = () => {
    setEditingExercise(null);
  };

  const renderExerciseCard = (exercise: Exercise) => {
    const isExpanded = expandedExerciseCards.has(exercise.exerciseId);
    const isSelected = isExerciseSelected(exercise);

    return (
      <div 
        key={exercise.exerciseId} 
        className={`exercise-card ${isExpanded ? 'expanded' : 'collapsed'} ${isSelected ? 'selected' : ''}`}
      >
        <div
          className="card-header clickable"
          onClick={() => toggleExerciseCard(exercise.exerciseId)}
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
                  onExerciseAdd(exercise);
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

  const renderTrainingExerciseCard = (exercise: PrescribedExercise) => {
    const isExpanded = expandedTrainingCards.has(exercise.exerciseId);

    return (
      <div 
        key={exercise.exerciseId} 
        className={`training-exercise-card ${isExpanded ? 'expanded' : 'collapsed'}`}
      >
        <div
          className="card-header clickable"
          onClick={() => toggleTrainingCard(exercise.exerciseId)}
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
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title="בחירת תרגילים לאימון"
        icon="💪"
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
              {exerciseMuscleGroups.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-icon">💪</div>
                  <h3>{searchTerm || muscleGroupFilter ? 'לא נמצאו תרגילים' : 'אין תרגילים זמינים'}</h3>
                  <p>{searchTerm || muscleGroupFilter ? 'נסה מילות חיפוש אחרות' : 'צור תרגילים חדשים בעמוד ניהול התרגילים'}</p>
                </div>
              ) : (
                <div className="exercise-group-view">
                  {exerciseMuscleGroups.map((group) => {
                    const isExpanded = expandedExerciseGroups.has(group.name);
                    
                    return (
                      <div key={group.name} className="muscle-group-section">
                        <div 
                          className="muscle-group-header"
                          onClick={() => toggleExerciseGroup(group.name)}
                        >
                          <div className="muscle-group-info">
                            <h3 className="muscle-group-name">{group.name}</h3>
                            <span className="exercise-count">{group.count} תרגילים</span>
                          </div>
                          <div className="expand-icon">
                            {isExpanded ? '▼' : '◀'}
                          </div>
                        </div>
                        
                        {isExpanded && (
                          <div className="muscle-group-exercises">
                            <div className="exercises-grid">
                              {group.exercises.map((exercise) => (
                                <div key={exercise.exerciseId}>
                                  {renderExerciseCard(exercise)}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
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
                <div className="exercise-group-view">
                  {trainingMuscleGroups.map((group) => {
                    const isExpanded = expandedTrainingGroups.has(group.name);
                    
                    return (
                      <div key={group.name} className="muscle-group-section">
                        <div 
                          className="muscle-group-header"
                          onClick={() => toggleTrainingGroup(group.name)}
                        >
                          <div className="muscle-group-info">
                            <h3 className="muscle-group-name">{group.name}</h3>
                            <span className="exercise-count">{group.count} תרגילים</span>
                          </div>
                          <div className="expand-icon">
                            {isExpanded ? '▼' : '◀'}
                          </div>
                        </div>
                        
                        {isExpanded && (
                          <div className="muscle-group-exercises">
                            <div className="exercises-grid">
                              {group.exercises.map((exercise) => (
                                <div key={exercise.exerciseId}>
                                  {renderTrainingExerciseCard(exercise)}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </Modal>

      {/* Exercise Parameters Edit Modal */}
      <Modal
        isOpen={!!editingExercise}
        onClose={handleCancelEdit}
        title="עריכת פרמטרי תרגיל"
        icon="⚙️"
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
              <label>הוראות נוספות לאימון</label>
              <textarea
                value={editData.prescriptionNote}
                onChange={(e) => setEditData(prev => ({ ...prev, prescriptionNote: e.target.value }))}
                placeholder="הוראות מיוחדות לתרגיל זה באימון..."
                rows={3}
              />
            </div>

            <div className="button-group justify-end">
              <button
                type="button"
                onClick={handleCancelEdit}
                className="btn-secondary"
              >
                ביטול
              </button>
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
    </>
  );
};

export default TrainingExerciseSelector;
