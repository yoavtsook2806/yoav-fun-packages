import React, { useState, useEffect } from 'react';
import { cachedApiService, TrainingPlanSummary, Exercise, TrainingItem, PrescribedExercise } from '../services/cachedApiService';
import { showError, showSuccess } from './ToastContainer';
import LoadingSpinner from './LoadingSpinner';
import Modal from './Modal';
import TrainingExerciseSelector from './TrainingExerciseSelector';
import './EditTrainingPlan.css';

interface EditTrainingPlanProps {
  coachId: string;
  token: string;
  plan: TrainingPlanSummary;
  isOpen: boolean;
  onClose: () => void;
  onPlanUpdated?: (updatedPlan: TrainingPlanSummary) => void;
}

const EditTrainingPlan: React.FC<EditTrainingPlanProps> = ({ 
  coachId, 
  token, 
  plan, 
  isOpen, 
  onClose, 
  onPlanUpdated 
}) => {
  const [loading, setLoading] = useState<boolean>(false);
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    trainings: [] as TrainingItem[]
  });
  const [currentTraining, setCurrentTraining] = useState<TrainingItem | null>(null);
  const [showTrainingForm, setShowTrainingForm] = useState(false);
  const [showExerciseSelector, setShowExerciseSelector] = useState(false);

  useEffect(() => {
    if (isOpen && plan) {
      loadPlanDetails();
      loadExercises();
    }
  }, [isOpen, plan]);

  const loadPlanDetails = async () => {
    try {
      setLoading(true);
      // Get full plan details
      const fullPlan = await cachedApiService.getTrainingPlan(coachId, plan.planId, token);
      setFormData({
        name: fullPlan.name,
        description: fullPlan.description || '',
        trainings: fullPlan.trainings || []
      });
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'שגיאה בטעינת פרטי התוכנית';
      showError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const loadExercises = async () => {
    try {
      const result = await cachedApiService.getExercises(coachId, token);
      setExercises(result.data);
    } catch (err) {
      console.error('Failed to load exercises:', err);
    }
  };

  const handleSave = async () => {
    if (!formData.name.trim()) {
      showError('שם התוכנית הוא שדה חובה');
      return;
    }

    try {
      setLoading(true);
      await cachedApiService.updateTrainingPlan(coachId, plan.planId, token, formData);
      showSuccess('תוכנית האימון עודכנה בהצלחה!');
      
      if (onPlanUpdated) {
        const updatedPlanSummary: TrainingPlanSummary = {
          ...plan,
          name: formData.name,
          description: formData.description,
          trainingsCount: formData.trainings.length
        };
        onPlanUpdated(updatedPlanSummary);
      }
      
      onClose();
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'שגיאה בעדכון תוכנית האימון';
      showError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const addTraining = () => {
    setCurrentTraining({
      trainingId: Date.now().toString(),
      name: '',
      order: formData.trainings.length + 1,
      exercises: []
    });
    setShowTrainingForm(true);
  };

  const editTraining = (training: TrainingItem) => {
    setCurrentTraining(training);
    setShowTrainingForm(true);
  };

  const deleteTraining = (trainingId: string) => {
    if (confirm('האם אתה בטוח שברצונך למחוק את האימון?')) {
      setFormData(prev => ({
        ...prev,
        trainings: prev.trainings.filter(t => t.trainingId !== trainingId)
      }));
    }
  };

  const saveCurrentTraining = () => {
    if (!currentTraining) return;

    if (!currentTraining.name?.trim()) {
      showError('יש להזין שם לאימון');
      return;
    }

    setFormData(prev => {
      const existingIndex = prev.trainings.findIndex(t => t.trainingId === currentTraining.trainingId);
      
      if (existingIndex >= 0) {
        // Update existing training
        const updatedTrainings = [...prev.trainings];
        updatedTrainings[existingIndex] = currentTraining;
        return { ...prev, trainings: updatedTrainings };
      } else {
        // Add new training
        return { ...prev, trainings: [...prev.trainings, currentTraining] };
      }
    });

    setShowTrainingForm(false);
    setCurrentTraining(null);
    showSuccess('האימון נשמר בהצלחה');
  };

  const addExerciseToTraining = (exercise: Exercise) => {
    if (!currentTraining) return;
    
    // Check if exercise is already added
    const isAlreadyAdded = currentTraining.exercises.some(ex => ex.exerciseId === exercise.exerciseId);
    if (isAlreadyAdded) return;
    
    const prescribedExercise: PrescribedExercise = {
      exerciseId: exercise.exerciseId,
      exerciseName: exercise.name,
      name: exercise.name,
      muscleGroup: exercise.muscleGroup,
      link: exercise.link,
      note: exercise.note,
      numberOfSets: 3,
      minimumTimeToRest: 60,
      maximumTimeToRest: 120,
      minimumNumberOfRepeasts: 8,
      maximumNumberOfRepeasts: 12,
      prescriptionNote: ''
    };
    
    setCurrentTraining(prev => prev ? {
      ...prev,
      exercises: [...prev.exercises, prescribedExercise]
    } : null);
  };

  const updateTrainingExercise = (index: number, updates: Partial<PrescribedExercise>) => {
    setCurrentTraining(prev => prev ? ({
      ...prev,
      exercises: prev.exercises.map((ex, i) => 
        i === index ? { ...ex, ...updates } : ex
      )
    }) : null);
  };

  const removeExerciseFromTraining = (index: number) => {
    setCurrentTraining(prev => prev ? ({
      ...prev,
      exercises: prev.exercises.filter((_, i) => i !== index)
    }) : null);
  };

  // New helper functions for the updated components
  const updateTrainingExerciseById = (exerciseId: string, updates: Partial<PrescribedExercise>) => {
    setCurrentTraining(prev => prev ? ({
      ...prev,
      exercises: prev.exercises.map(ex => 
        ex.exerciseId === exerciseId ? { ...ex, ...updates } : ex
      )
    }) : null);
  };

  const removeExerciseFromTrainingById = (exerciseId: string) => {
    setCurrentTraining(prev => prev ? ({
      ...prev,
      exercises: prev.exercises.filter(ex => ex.exerciseId !== exerciseId)
    }) : null);
  };

  const saveTraining = (training: TrainingItem) => {
    setFormData(prev => ({
      ...prev,
      trainings: prev.trainings.some(t => t.trainingId === training.trainingId)
        ? prev.trainings.map(t => t.trainingId === training.trainingId ? training : t)
        : [...prev.trainings, training]
    }));
    setShowTrainingForm(false);
    setCurrentTraining(null);
  };

  if (!isOpen) return null;

  return (
    <div className="edit-training-plan-overlay">
      <div className="edit-training-plan-modal">
        <div className="modal-header">
          <h2>עריכת תוכנית אימון</h2>
          <button onClick={onClose} className="close-button">✕</button>
        </div>

        <div className="modal-content">
          {loading ? (
            <LoadingSpinner message="טוען פרטי התוכנית..." />
          ) : (
            <>
              <div className="plan-basic-info">
                <div className="form-group">
                  <label>שם התוכנית</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="הכנס שם לתוכנית"
                    dir="rtl"
                  />
                </div>

                <div className="form-group">
                  <label>תיאור (אופציונלי)</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="תיאור התוכנית"
                    dir="rtl"
                    rows={3}
                  />
                </div>
              </div>

              <div className="trainings-section">
                <div className="section-header">
                  <h3>אימונים בתוכנית ({formData.trainings.length})</h3>
                  <button onClick={addTraining} className="add-training-btn">
                    הוסף אימון
                  </button>
                </div>

                <div className="trainings-list">
                  {formData.trainings.map((training, index) => (
                    <div key={training.trainingId} className="training-item">
                      <div className="training-header">
                        <h4>{training.name || `אימון ${index + 1}`}</h4>
                        <div className="training-actions">
                          <button onClick={() => editTraining(training)} className="edit-btn">✏️</button>
                          <button onClick={() => deleteTraining(training.trainingId)} className="delete-btn">🗑️</button>
                        </div>
                      </div>
                      <p className="exercise-count">{training.exercises.length} תרגילים</p>
                    </div>
                  ))}
                  
                  {formData.trainings.length === 0 && (
                    <div className="empty-trainings">
                      <p>אין אימונים בתוכנית עדיין</p>
                      <button onClick={addTraining} className="add-first-training-btn">
                        הוסף אימון ראשון
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <div className="modal-actions">
                <button onClick={onClose} className="cancel-btn">ביטול</button>
                <button onClick={handleSave} className="save-btn" disabled={loading}>
                  {loading ? 'שומר...' : 'שמור שינויים'}
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Training Form Modal - New Two-Section Layout */}
      <Modal 
        isOpen={showTrainingForm} 
        onClose={() => setShowTrainingForm(false)}
        title={currentTraining?.name ? 'עריכת אימון' : 'הוספת אימון חדש'}
        size="xl"
      >
        {currentTraining && (
          <div className="training-form-new">
            {/* Training Name Section */}
            <div className="training-name-section">
              <div className="form-group">
                <label htmlFor="training-name-input">שם האימון *</label>
                <input
                  id="training-name-input"
                  type="text"
                  value={currentTraining.name || ''}
                  onChange={(e) => setCurrentTraining(prev => prev ? { ...prev, name: e.target.value } : null)}
                  placeholder="לדוגמה: A, B, C או חזה וכתפיים"
                  dir="rtl"
                />
              </div>
            </div>

            {/* Exercise Selection */}
            <div className="exercise-selection-section">
              <div className="section-header">
                <h3>תרגילים באימון</h3>
                <div className="exercises-count">
                  {currentTraining.exercises.length} תרגילים
                </div>
              </div>

              <div className="exercise-selection-actions">
                <button 
                  type="button" 
                  onClick={() => setShowExerciseSelector(true)}
                  className="btn-primary"
                >
                  <span className="btn-icon">💪</span>
                  בחר תרגילים
                </button>
              </div>

              {currentTraining.exercises.length > 0 && (
                <div className="selected-exercises-summary">
                  <h4>תרגילים שנבחרו:</h4>
                  <div className="exercises-list">
                    {currentTraining.exercises.map((exercise) => (
                      <div key={exercise.exerciseId} className="exercise-summary-item">
                        <div className="exercise-info">
                          <span className="exercise-name">{exercise.name}</span>
                          <span className="exercise-details">
                            🎯 {exercise.muscleGroup} • 
                            🔢 {exercise.numberOfSets || 3} סטים • 
                            🔁 {exercise.minimumNumberOfRepeasts || 8}-{exercise.maximumNumberOfRepeasts || 12} חזרות
                          </span>
                        </div>
                        <button 
                          type="button" 
                          onClick={() => removeExerciseFromTrainingById(exercise.exerciseId)}
                          className="remove-exercise-btn"
                          title="הסר תרגיל"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {currentTraining.exercises.length === 0 && (
                <div className="empty-exercises">
                  <p>עדיין לא נבחרו תרגילים לאימון זה</p>
                  <p>השתמש בכפתור "בחר תרגילים" למעלה כדי להוסיף תרגילים</p>
                </div>
              )}
            </div>

            {/* Form Actions */}
            <div className="training-form-actions">
              <button 
                type="button" 
                onClick={() => setShowTrainingForm(false)} 
                className="btn-secondary"
              >
                <span className="btn-icon">✕</span>
                ביטול
              </button>
              <button 
                type="button" 
                onClick={saveCurrentTraining} 
                className="btn-primary"
                disabled={!currentTraining.name?.trim() || currentTraining.exercises.length === 0}
              >
                <span className="btn-icon">💾</span>
                שמור אימון
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Training Exercise Selector Modal */}
      {currentTraining && (
        <TrainingExerciseSelector
          isOpen={showExerciseSelector}
          onClose={() => setShowExerciseSelector(false)}
          exercises={exercises}
          trainingExercises={currentTraining.exercises}
          onExerciseAdd={addExerciseToTraining}
          onExerciseUpdate={updateTrainingExerciseById}
          onExerciseRemove={removeExerciseFromTrainingById}
        />
      )}
    </div>
  );
};

export default EditTrainingPlan;
