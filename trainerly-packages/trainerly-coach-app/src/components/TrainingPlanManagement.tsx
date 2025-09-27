import React, { useState, useEffect } from 'react';
import { cachedApiService, TrainingPlanSummary, Exercise, TrainingItem, PrescribedExercise, Coach } from '../services/cachedApiService';
import { showError, showSuccess } from './ToastContainer';
import EditTrainingPlan from './EditTrainingPlan';
import Card from './Card';
import Modal from './Modal';
import TrainingExerciseSelector from './TrainingExerciseSelector';
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
  const [showTrainingExerciseSelector, setShowTrainingExerciseSelector] = useState(false);
  const [editingTrainingIndex, setEditingTrainingIndex] = useState<number | null>(null);

  useEffect(() => {
    loadData();
    
    // Listen for cache updates
    const handleCacheUpdate = (event: Event) => {
      const customEvent = event as CustomEvent;
      const { cacheKey, coachId: updatedCoachId, data } = customEvent.detail;
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
    if (!currentTraining.name?.trim()) {
      showError('יש להזין שם לאימון');
      return;
    }

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
    showSuccess('האימון נשמר בהצלחה');
  };


  const addExerciseToCurrentTraining = (exercise: Exercise) => {
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
    
    setCurrentTraining(prev => ({
      ...prev,
      exercises: [...prev.exercises, prescribedExercise]
    }));
  };

  const updateCurrentTrainingExercise = (exerciseId: string, updates: Partial<PrescribedExercise>) => {
    setCurrentTraining(prev => ({
      ...prev,
      exercises: prev.exercises.map(ex => 
        ex.exerciseId === exerciseId ? { ...ex, ...updates } : ex
      )
    }));
  };

  const removeExerciseFromCurrentTraining = (exerciseId: string) => {
    setCurrentTraining(prev => ({
      ...prev,
      exercises: prev.exercises.filter(ex => ex.exerciseId !== exerciseId)
    }));
  };

  const removeTraining = (index: number) => {
    setFormData(prev => ({
      ...prev,
      trainings: prev.trainings.filter((_, i) => i !== index)
    }));
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
      </div>

      {error && (
        <div className="error-message">
          <span className="error-icon">⚠️</span>
          {error}
        </div>
      )}

      {/* Add Plan Modal */}
      <Modal
        isOpen={showAddForm}
        onClose={resetPlanForm}
        title="יצירת תוכנית אימון חדשה"
        icon="📋"
        size="lg"
      >
            
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
                  <button type="button" onClick={addTraining} className="add-training-button">
                    ➕ הוסף אימון
                  </button>
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
                      <p>השתמש בכפתור "הוסף אימון" למעלה כדי להתחיל</p>
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
      </Modal>

      {/* Training Form Modal - Just Name Input */}
      <Modal
        isOpen={showTrainingForm}
        onClose={() => setShowTrainingForm(false)}
        title={editingTrainingIndex !== null ? 'עריכת אימון' : 'הוספת אימון חדש'}
        icon="🏋️"
        size="sm"
      >
        <div className="training-form">
          <div className="form-group">
            <label>שם האימון *</label>
            <input
              type="text"
              value={currentTraining.name}
              onChange={(e) => setCurrentTraining(prev => ({ ...prev, name: e.target.value }))}
              placeholder="לדוגמה: A, B, C או חזה וכתפיים"
              dir="rtl"
            />
          </div>

          <div className="form-actions">
            <button type="button" onClick={() => setShowTrainingForm(false)} className="btn-secondary">
              ביטול
            </button>
            <button 
              type="button" 
              onClick={() => {
                if (!currentTraining.name?.trim()) {
                  showError('יש להזין שם לאימון');
                  return;
                }
                setShowTrainingForm(false);
                setShowTrainingExerciseSelector(true);
              }} 
              className="btn-primary"
              disabled={!currentTraining.name?.trim()}
            >
              <span className="btn-icon">💪</span>
              בחר תרגילים
            </button>
          </div>
        </div>
      </Modal>

      {/* Training Exercise Selector Modal */}
      <TrainingExerciseSelector
        isOpen={showTrainingExerciseSelector}
        onClose={() => setShowTrainingExerciseSelector(false)}
        exercises={exercises}
        trainingExercises={currentTraining.exercises}
        onExerciseAdd={addExerciseToCurrentTraining}
        onExerciseUpdate={updateCurrentTrainingExercise}
        onExerciseRemove={removeExerciseFromCurrentTraining}
        onSave={() => {
          setShowTrainingExerciseSelector(false);
          saveTraining();
        }}
        trainingName={currentTraining.name}
      />

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
          plans
            .filter(plan => !plan.customTrainee)
            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
            .map((plan) => {
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
