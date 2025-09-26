import React, { useState, useEffect } from 'react';
import { cachedApiService, TrainingPlanSummary, Exercise, TrainingItem, PrescribedExercise } from '../services/cachedApiService';
import { showError, showSuccess } from './ToastContainer';
import LoadingSpinner from './LoadingSpinner';
import Modal from './Modal';
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
    
    const prescribedExercise: PrescribedExercise = {
      exerciseName: exercise.name,
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

      {/* Training Form Modal - Using Generic Modal */}
      <Modal 
        isOpen={showTrainingForm} 
        onClose={() => setShowTrainingForm(false)}
        title={currentTraining?.name ? 'עריכת אימון' : 'הוספת אימון חדש'}
      >
        {currentTraining && (
          <div className="training-form">
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

            <div className="exercises-section">
              <div className="section-header">
                <h3>תרגילים באימון</h3>
              </div>

              {/* Exercise Selection */}
              <div className="exercise-selection">
                <h4>בחר תרגילים מהספרייה:</h4>
                <div className="available-exercises">
                  {exercises.map((exercise) => (
                    <div key={exercise.exerciseId} className="available-exercise">
                      <div className="exercise-info">
                        <span className="exercise-name">{exercise.name}</span>
                        {exercise.muscleGroup && (
                          <span className="exercise-muscle-group">🎯 {exercise.muscleGroup}</span>
                        )}
                      </div>
                      <button 
                        type="button" 
                        onClick={() => addExerciseToTraining(exercise)}
                        className="add-exercise-button"
                        disabled={currentTraining.exercises.some(ex => ex.exerciseName === exercise.name)}
                      >
                        {currentTraining.exercises.some(ex => ex.exerciseName === exercise.name) ? '✓' : '➕'}
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Selected Exercises */}
              <div className="selected-exercises">
                <h4>תרגילים שנבחרו:</h4>
                {currentTraining.exercises.map((trainingEx, index) => (
                  <div key={index} className="training-exercise-item">
                    <div className="exercise-info">
                      <h5>{trainingEx.exerciseName}</h5>
                    </div>
                    
                    <div className="exercise-params">
                      <div className="param-group">
                        <label>סטים</label>
                        <input
                          type="number"
                          value={trainingEx.numberOfSets}
                          onChange={(e) => updateTrainingExercise(index, { numberOfSets: parseInt(e.target.value) || 1 })}
                          min="1"
                          max="10"
                        />
                      </div>
                      
                      <div className="param-group">
                        <label>חזרות מינימום</label>
                        <input
                          type="number"
                          value={trainingEx.minimumNumberOfRepeasts}
                          onChange={(e) => updateTrainingExercise(index, { minimumNumberOfRepeasts: parseInt(e.target.value) || 1 })}
                          min="1"
                          max="50"
                        />
                      </div>
                      
                      <div className="param-group">
                        <label>חזרות מקסימום</label>
                        <input
                          type="number"
                          value={trainingEx.maximumNumberOfRepeasts}
                          onChange={(e) => updateTrainingExercise(index, { maximumNumberOfRepeasts: parseInt(e.target.value) || 1 })}
                          min="1"
                          max="50"
                        />
                      </div>
                      
                      <div className="param-group">
                        <label>מנוחה מינימום (שניות)</label>
                        <input
                          type="number"
                          value={trainingEx.minimumTimeToRest}
                          onChange={(e) => updateTrainingExercise(index, { minimumTimeToRest: parseInt(e.target.value) || 30 })}
                          min="15"
                          max="300"
                          step="15"
                        />
                      </div>
                      
                      <div className="param-group">
                        <label>מנוחה מקסימום (שניות)</label>
                        <input
                          type="number"
                          value={trainingEx.maximumTimeToRest}
                          onChange={(e) => updateTrainingExercise(index, { maximumTimeToRest: parseInt(e.target.value) || 60 })}
                          min="15"
                          max="300"
                          step="15"
                        />
                      </div>
                    </div>
                    
                    <div className="exercise-notes">
                      <label>הערות</label>
                      <input
                        type="text"
                        value={trainingEx.prescriptionNote || ''}
                        onChange={(e) => updateTrainingExercise(index, { prescriptionNote: e.target.value })}
                        placeholder="הערות נוספות (אופציונלי)"
                      />
                    </div>
                    
                    <button 
                      type="button" 
                      onClick={() => removeExerciseFromTraining(index)}
                      className="remove-exercise-button"
                    >
                      🗑️
                    </button>
                  </div>
                ))}
                {currentTraining.exercises.length === 0 && (
                  <p className="no-exercises">לא נבחרו תרגילים עדיין</p>
                )}
              </div>
            </div>

            <div className="training-form-actions">
              <button 
                type="button" 
                onClick={() => setShowTrainingForm(false)} 
                className="cancel-btn"
              >
                ביטול
              </button>
              <button 
                type="button" 
                onClick={saveCurrentTraining} 
                className="save-btn"
                disabled={!currentTraining.name?.trim() || currentTraining.exercises.length === 0}
              >
                שמור אימון
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default EditTrainingPlan;
