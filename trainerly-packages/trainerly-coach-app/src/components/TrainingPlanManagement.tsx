import React, { useState, useEffect } from 'react';
import { cachedApiService, TrainingPlanSummary, Exercise, TrainingItem, PrescribedExercise, Coach } from '../services/cachedApiService';
import { showError, showSuccess } from './ToastContainer';
import AdminTrainingPlanBank from './AdminTrainingPlanBank';
import EditTrainingPlan from './EditTrainingPlan';
import Card from './Card';
import './TrainingPlanManagement.css';

interface TrainingPlanManagementProps {
  coachId: string;
  token: string;
  coach: Coach; // Add coach prop to check if admin
  onBack: () => void;
}

const TrainingPlanManagement: React.FC<TrainingPlanManagementProps> = ({ coachId, token, coach, onBack }) => {
  const [plans, setPlans] = useState<TrainingPlanSummary[]>([]);
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showAdminPlanBank, setShowAdminPlanBank] = useState(false);
  const [editingPlan, setEditingPlan] = useState<TrainingPlanSummary | null>(null);
  const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set());
  
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    trainings: [] as TrainingItem[]
  });
  
  const [currentTraining, setCurrentTraining] = useState<TrainingItem>({
    trainingId: '',
    name: '',
    order: 0,
    exercises: []
  });
  
  const [showTrainingForm, setShowTrainingForm] = useState(false);
  const [editingTrainingIndex, setEditingTrainingIndex] = useState<number | null>(null);

  useEffect(() => {
    loadData();
    
    // Listen for cache updates
    const handleCacheUpdate = (event: CustomEvent) => {
      const { cacheKey, coachId: updatedCoachId, data } = event.detail;
      if (updatedCoachId === coachId) {
        if (cacheKey === 'training_plans') {
          console.log('🔄 Training plans updated from background sync');
          setPlans(data);
        } else if (cacheKey === 'exercises') {
          console.log('🔄 Exercises updated from background sync');
          setExercises(data);
        }
      }
    };
    
    window.addEventListener('cacheUpdated', handleCacheUpdate);
    
    return () => {
      window.removeEventListener('cacheUpdated', handleCacheUpdate);
    };
  }, [coachId]);

  const loadData = async () => {
    try {
      const [planResult, exerciseResult] = await Promise.all([
        cachedApiService.getTrainingPlans(coachId, token, { backgroundUpdate: true }),
        cachedApiService.getExercises(coachId, token, { backgroundUpdate: true })
      ]);
      
      setPlans(planResult.data);
      setExercises(exerciseResult.data);
      
      // Only show loading if both data sources didn't come from cache
      if (!planResult.fromCache || !exerciseResult.fromCache) {
        setLoading(true);
      }
      
      setError(null);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'שגיאה בטעינת הנתונים';
      setError(errorMsg);
      showError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitPlan = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      await cachedApiService.createTrainingPlan(coachId, token, formData);
      await loadData();
      resetPlanForm();
      setError(null);
      showSuccess('תוכנית אימון נשמרה בהצלחה!');
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'שגיאה בשמירת תוכנית האימון';
      setError(errorMsg);
      showError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const resetPlanForm = () => {
    setFormData({
      name: '',
      description: '',
      trainings: []
    });
    setShowAddForm(false);
  };

  const handleEditPlan = (plan: TrainingPlanSummary) => {
    setEditingPlan(plan);
  };

  const handleDeletePlan = async (plan: TrainingPlanSummary) => {
    if (confirm(`האם אתה בטוח שברצונך למחוק את תוכנית "${plan.name}"?`)) {
      try {
        // Add deleting class for animation
        const planElement = document.querySelector(`[data-plan-id="${plan.planId}"]`);
        if (planElement) {
          planElement.classList.add('deleting');
        }
        
        // Wait for animation to start
        await new Promise(resolve => setTimeout(resolve, 100));
        
        await cachedApiService.deleteTrainingPlan(coachId, plan.planId, token);
        showSuccess(`תוכנית "${plan.name}" נמחקה בהצלחה`);
        // Plans will be updated automatically via cache event
      } catch (err) {
        // Remove deleting class if error occurred
        const planElement = document.querySelector(`[data-plan-id="${plan.planId}"]`);
        if (planElement) {
          planElement.classList.remove('deleting');
        }
        
        const errorMsg = err instanceof Error ? err.message : 'שגיאה במחיקת תוכנית האימון';
        showError(errorMsg);
      }
    }
  };

  const addTraining = () => {
    setCurrentTraining({
      trainingId: Date.now().toString(),
      name: '',
      order: formData.trainings.length,
      exercises: []
    });
    setEditingTrainingIndex(null);
    setShowTrainingForm(true);
  };

  const editTraining = (index: number) => {
    setCurrentTraining({ ...formData.trainings[index] });
    setEditingTrainingIndex(index);
    setShowTrainingForm(true);
  };

  const saveTraining = () => {
    if (editingTrainingIndex !== null) {
      const updatedTrainings = [...formData.trainings];
      updatedTrainings[editingTrainingIndex] = currentTraining;
      setFormData(prev => ({ ...prev, trainings: updatedTrainings }));
    } else {
      setFormData(prev => ({ 
        ...prev, 
        trainings: [...prev.trainings, currentTraining] 
      }));
    }
    setShowTrainingForm(false);
    setCurrentTraining({ trainingId: '', name: '', order: 0, exercises: [] });
  };

  const removeTraining = (index: number) => {
    setFormData(prev => ({
      ...prev,
      trainings: prev.trainings.filter((_, i) => i !== index)
    }));
  };

  const addExerciseToTraining = (exercise: Exercise) => {
    const prescribedExercise: PrescribedExercise = {
      exerciseName: exercise.name,
      numberOfSets: 3,
      minimumTimeToRest: 60,
      maximumTimeToRest: 120,
      minimumNumberOfRepeasts: 8,
      maximumNumberOfRepeasts: 12,
      prescriptionNote: ''
    };
    
    setCurrentTraining(prev => ({
      ...prev,
      exercises: [...prev.exercises, prescribedExercise]
    }));
  };

  const updateTrainingExercise = (index: number, updates: Partial<PrescribedExercise>) => {
    setCurrentTraining(prev => ({
      ...prev,
      exercises: prev.exercises.map((ex, i) => 
        i === index ? { ...ex, ...updates } : ex
      )
    }));
  };

  const removeExerciseFromTraining = (index: number) => {
    setCurrentTraining(prev => ({
      ...prev,
      exercises: prev.exercises.filter((_, i) => i !== index)
    }));
  };

  const getExerciseName = (exerciseName: string) => {
    return exerciseName || 'תרגיל לא נמצא';
  };

  const toggleCardExpansion = (planId: string) => {
    const newExpandedCards = new Set(expandedCards);
    if (expandedCards.has(planId)) {
      newExpandedCards.delete(planId);
    } else {
      newExpandedCards.add(planId);
    }
    setExpandedCards(newExpandedCards);
  };

  if (loading && plans.length === 0) {
    return (
      <div className="training-plan-management">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>טוען תוכניות אימון...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="training-plan-management-content">
      <div className="management-actions">
        <button
          onClick={() => setShowAddForm(true)}
          className="btn-primary"
          disabled={loading}
        >
          <span className="btn-icon">➕</span>
          הוסף תוכנית חדשה
        </button>
        {!coach.isAdmin && (
          <button
            onClick={() => setShowAdminPlanBank(true)}
            className="btn-secondary"
            disabled={loading}
          >
            <span className="btn-icon">🏦</span>
            בנק תוכניות מנהל
          </button>
        )}
      </div>

      {error && (
        <div className="error-message">
          <span className="error-icon">⚠️</span>
          {error}
        </div>
      )}

      {/* Add Plan Modal */}
      {showAddForm && (
        <div className="modal-overlay">
          <div className="plan-form-modal">
            <div className="modal-header">
              <h2>יצירת תוכנית אימון חדשה</h2>
              <button onClick={resetPlanForm} className="close-button">✕</button>
            </div>
            
            <form onSubmit={handleSubmitPlan} className="plan-form">
              <div className="form-group">
                <label>שם התוכנית *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  required
                  placeholder="לדוגמה: תוכנית מתחילים"
                />
              </div>

              <div className="form-group">
                <label>תיאור</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="תיאור התוכנית"
                  rows={3}
                />
              </div>

              <div className="trainings-section">
                <div className="section-header">
                  <h3>אימונים בתוכנית</h3>
                </div>

                <div className="trainings-list">
                  {formData.trainings.map((training, index) => (
                    <div key={training.trainingId} className="training-item">
                      <div className="training-header">
                        <h4>אימון {training.name}</h4>
                        <div className="training-actions">
                          <button type="button" onClick={() => editTraining(index)} className="edit-button">
                            ✏️
                          </button>
                          <button type="button" onClick={() => removeTraining(index)} className="remove-button">
                            🗑️
                          </button>
                        </div>
                      </div>
                      <div className="training-exercises">
                        {training.exercises.length} תרגילים
                      </div>
                    </div>
                  ))}
                  
                  {formData.trainings.length === 0 && (
                    <div className="empty-trainings">
                      <p>עדיין לא נוספו אימונים לתוכנית</p>
                      <button type="button" onClick={addTraining} className="empty-action-button">
                        הוסף אימון ראשון
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <div className="form-actions">
                <button type="button" onClick={resetPlanForm} className="cancel-button">
                  ביטול
                </button>
                <button type="submit" className="save-button" disabled={loading || formData.trainings.length === 0}>
                  {loading ? 'שומר...' : 'שמור תוכנית'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Training Form Modal */}
      {showTrainingForm && (
        <div className="modal-overlay">
          <div className="training-form-modal">
            <div className="modal-header">
              <h2>{editingTrainingIndex !== null ? 'עריכת אימון' : 'הוספת אימון חדש'}</h2>
              <button onClick={() => setShowTrainingForm(false)} className="close-button">✕</button>
            </div>
            
            <div className="training-form">
              <div className="form-group">
                <label>שם האימון *</label>
                <input
                  type="text"
                  value={currentTraining.name}
                  onChange={(e) => setCurrentTraining(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="לדוגמה: A, B, C או חזה וכתפיים"
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
                        <h5>{getExerciseName(trainingEx.exerciseName)}</h5>
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
                    <div className="empty-exercises">
                      <p>עדיין לא נבחרו תרגילים לאימון זה</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="form-actions">
                <button type="button" onClick={() => setShowTrainingForm(false)} className="cancel-button">
                  ביטול
                </button>
                <button 
                  type="button" 
                  onClick={saveTraining} 
                  className="save-button"
                  disabled={!currentTraining.name.trim() || currentTraining.exercises.length === 0}
                >
                  שמור אימון
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Plans Grid */}
      <div className="plans-grid">
        {plans.length === 0 ? (
          <Card>
            <div className="empty-state">
              <div className="empty-icon">📋</div>
              <h3>אין תוכניות אימון עדיין</h3>
              <p>התחל ביצירת התוכנית הראשונה שלך</p>
              <button onClick={() => setShowAddForm(true)} className="btn-primary">
                צור תוכנית ראשונה
              </button>
            </div>
          </Card>
        ) : (
          plans.filter(plan => !plan.customTrainee).map((plan) => {
            const isExpanded = expandedCards.has(plan.planId);
            return (
              <Card key={plan.planId} data-id={plan.planId} className={isExpanded ? 'expanded' : 'collapsed'}>
                <div
                  className="card-header clickable"
                  onClick={() => toggleCardExpansion(plan.planId)}
                >
                  <div className="card-controls">
                    <span className="expand-icon">{isExpanded ? '▼' : '▲'}</span>
                  </div>
                  <div className="plan-info">
                    <h3 className="card-title">{plan.name}</h3>
                    {!isExpanded && plan.description && (
                      <p className="card-subtitle">{plan.description}</p>
                    )}
                  </div>
                </div>

                {isExpanded && (
                  <div className="card-details">
                    {plan.description && (
                      <p className="card-subtitle">{plan.description}</p>
                    )}

                    <div className="card-stats">
                      <div className="card-stat">
                        <span className="card-stat-number">{plan.trainingsCount}</span>
                        <span className="card-stat-label">אימונים</span>
                      </div>
                      <div className="card-stat">
                        <span className="card-stat-number">{exercises.length}</span>
                        <span className="card-stat-label">תרגילים</span>
                      </div>
                    </div>

                    <div className="card-footer">
                      <span className="card-meta">נוצר ב-{new Date(plan.createdAt).toLocaleDateString('he-IL')}</span>
                    </div>

                    <div className="card-actions-section">
                      <button
                        className="btn-secondary btn-sm"
                        title="ערוך תוכנית"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEditPlan(plan);
                        }}
                      >
                        <span className="btn-icon">✏️</span>
                        ערוך תוכנית
                      </button>
                      <button
                        className="btn-warning btn-sm"
                        title="מחק תוכנית"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeletePlan(plan);
                        }}
                      >
                        <span className="btn-icon">🗑️</span>
                        מחק תוכנית
                      </button>
                    </div>
                  </div>
                )}
              </Card>
            );
          })
        )}
      </div>

      {/* Admin Training Plan Bank Modal */}
      <AdminTrainingPlanBank
        coachId={coachId}
        token={token}
        isOpen={showAdminPlanBank}
        onClose={() => setShowAdminPlanBank(false)}
        onPlanCopied={(plan) => {
          // Refresh plans after copying
          loadData();
        }}
      />

      {/* Edit Training Plan Modal */}
      {editingPlan && (
        <EditTrainingPlan
          coachId={coachId}
          token={token}
          plan={editingPlan}
          isOpen={!!editingPlan}
          onClose={() => setEditingPlan(null)}
          onPlanUpdated={(updatedPlan) => {
            // Plans will be updated automatically via cache event
            setEditingPlan(null);
          }}
        />
      )}
    </div>
  );
};

export default TrainingPlanManagement;
