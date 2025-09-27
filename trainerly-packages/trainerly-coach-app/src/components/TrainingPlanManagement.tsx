import React, { useState, useEffect } from 'react';
import { cachedApiService, TrainingPlanSummary, Exercise, TrainingItem, PrescribedExercise, Coach } from '../services/cachedApiService';
import { showError, showSuccess } from 'trainerly-ui-components';
import { LoadingSpinner } from 'trainerly-ui-components';
import EditTrainingPlan from './EditTrainingPlan';
import { Card, Modal, ExerciseGroupView, Title } from 'trainerly-ui-components';
import ExerciseParameterModal, { ExerciseParameters } from './ExerciseParameterModal';
import './TrainingPlanManagement.css';
import './ExerciseGroupView.css';

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
  const [showParameterModal, setShowParameterModal] = useState(false);
  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(null);
  const [editingTrainingExercise, setEditingTrainingExercise] = useState<PrescribedExercise | null>(null);
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
      
      if (editingPlan) {
        // Update existing plan
        await cachedApiService.updateTrainingPlan(coachId, editingPlan.planId, token, formData);
        showSuccess('תוכנית האימון עודכנה בהצלחה!');
        setEditingPlan(null);
      } else {
        // Create new plan
        await cachedApiService.createTrainingPlan(coachId, token, formData);
        showSuccess('תוכנית אימון נשמרה בהצלחה!');
        setShowAddForm(false);
      }
      
      await loadData();
      resetPlanForm();
      setError(null);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 
        editingPlan ? 'שגיאה בעדכון תוכנית האימון' : 'שגיאה בשמירת תוכנית האימון';
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

  const handleEditPlan = async (plan: TrainingPlanSummary) => {
    try {
      setLoading(true);
      // Load full plan details for editing
      const fullPlan = await cachedApiService.getTrainingPlan(coachId, plan.planId, token);
      setFormData({
        name: fullPlan.name,
        description: fullPlan.description || '',
        trainings: fullPlan.trainings || []
      });
      setEditingPlan(plan);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'שגיאה בטעינת פרטי התוכנית';
      showError(errorMsg);
    } finally {
      setLoading(false);
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

  const editTraining = (training: TrainingItem) => {
    setCurrentTraining({ ...training });
    setEditingTrainingIndex(formData.trainings.findIndex(t => t.trainingId === training.trainingId));
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

  const handleSave = async () => {
    if (!formData.name.trim()) {
      showError('שם התוכנית הוא שדה חובה');
      return;
    }

    try {
      setLoading(true);
      
      if (editingPlan) {
        // Update existing plan
        await cachedApiService.updateTrainingPlan(coachId, editingPlan.planId, token, formData);
        showSuccess('תוכנית האימון עודכנה בהצלחה!');
        setEditingPlan(null);
      } else {
        // Create new plan
        await cachedApiService.createTrainingPlan(coachId, token, formData);
        showSuccess('תוכנית האימון נוצרה בהצלחה!');
        setShowAddForm(false);
      }
      
      resetPlanForm();
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 
        editingPlan ? 'שגיאה בעדכון תוכנית האימון' : 'שגיאה ביצירת תוכנית האימון';
      showError(errorMsg);
    } finally {
      setLoading(false);
    }
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

  const handleExerciseSelect = (exercise: Exercise) => {
    // Check if exercise is already added
    const isAlreadyAdded = currentTraining.exercises.some(ex => ex.exerciseId === exercise.exerciseId);
    if (isAlreadyAdded) return;
    
    setSelectedExercise(exercise);
    setShowParameterModal(true);
  };

  const handleParameterSave = (parameters: ExerciseParameters) => {
    if (!selectedExercise) return;
    
    const prescribedExercise: PrescribedExercise = {
      exerciseId: selectedExercise.exerciseId,
      exerciseName: selectedExercise.name,
      name: selectedExercise.name,
      muscleGroup: selectedExercise.muscleGroup,
      link: selectedExercise.link,
      note: selectedExercise.note,
      ...parameters
    };
    
    setCurrentTraining(prev => ({
      ...prev,
      exercises: [...prev.exercises, prescribedExercise]
    }));
    
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
    
    setCurrentTraining(prev => ({
      ...prev,
      exercises: prev.exercises.map(ex => 
        ex.exerciseId === editingTrainingExercise.exerciseId ? { ...ex, ...parameters } : ex
      )
    }));
    
    setEditingTrainingExercise(null);
    setSelectedExercise(null);
  };

  const isExerciseSelected = (exercise: Exercise) => {
    return currentTraining.exercises.some(selected => selected.exerciseId === exercise.exerciseId);
  };

  const renderExerciseCard = (exercise: Exercise) => {
    const isExpanded = expandedCards.has(exercise.exerciseId);
    const isSelected = isExerciseSelected(exercise);

    return (
      <Card 
        key={exercise.exerciseId} 
        data-id={exercise.exerciseId} 
        className={`${isExpanded ? 'expanded' : 'collapsed'} ${isSelected ? 'selected' : ''}`}
      >
        <div
          className="card-header clickable"
          onClick={() => toggleCardExpansion(exercise.exerciseId)}
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
          <div className="card-top-actions">
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleExerciseSelect(exercise);
              }}
              className={`add-exercise-btn ${isSelected ? 'selected' : ''}`}
              disabled={isSelected}
              title={isSelected ? 'תרגיל נבחר' : 'הוסף לאימון'}
            >
              {isSelected ? '✅' : '➕'}
            </button>
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

          </div>
        )}
      </Card>
    );
  };

  const renderTrainingExerciseCard = (exercise: PrescribedExercise) => {
    const isExpanded = expandedCards.has(exercise.exerciseId);

    return (
      <Card 
        key={exercise.exerciseId} 
        data-id={exercise.exerciseId} 
        className={isExpanded ? 'expanded' : 'collapsed'}
      >
        <div
          className="card-header clickable"
          onClick={() => toggleCardExpansion(exercise.exerciseId)}
        >
          <div className="card-controls">
            <span className="expand-icon">{isExpanded ? '▼' : '▲'}</span>
          </div>
          <div className="exercise-info">
            <h3 className="card-title">{exercise.name}</h3>
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
                  removeExerciseFromCurrentTraining(exercise.exerciseId);
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
        size="xl"
      >
        <div className="plan-modal-content">
          <form className="plan-form">
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
          </form>

          <Title level={3}>אימונים בתוכנית</Title>

          <div className="trainings-list">
            {formData.trainings.map((training, index) => (
              <Card
                key={training.trainingId}
                variant="simple"
                title={`אימון ${training.name}`}
                label={`${training.exercises.length} תרגילים`}
                labelColor="purple"
                onEdit={() => editTraining(training)}
                onRemove={() => deleteTraining(training.trainingId)}
              />
            ))}
            
            {formData.trainings.length === 0 && (
              <div className="empty-trainings">
                <p>עדיין לא נוספו אימונים לתוכנית</p>
                <p>השתמש בכפתור "הוסף אימון" למטה כדי להתחיל</p>
              </div>
            )}
          </div>

          <div className="modal-actions">
            <button 
              type="button" 
              onClick={addTraining} 
              className="btn-purple"
            >
              ➕ הוסף אימון
            </button>
            <button 
              type="button" 
              onClick={handleSave} 
              className="btn-success"
              disabled={loading || !formData.name.trim() || formData.trainings.length === 0}
            >
              {loading ? 'שומר...' : 'שמור תוכנית'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Training Form Modal - Complete Interface */}
      <div className={`training-form-modal-wrapper ${showTrainingForm ? 'active' : ''}`}>
        <Modal
          isOpen={showTrainingForm}
          onClose={() => setShowTrainingForm(false)}
          title={editingTrainingIndex !== null ? 'עריכת אימון' : 'הוספת אימון חדש'}
          size="xl"
        >
            <div className="training-form">
          {/* Training Name */}
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

          {/* Two-Section Layout */}
          <div className="training-sections">
            {/* Top Section: Exercise Browser */}
            <div className="exercise-browser-section">
                <div className="section-header">
                <h3 className="section-title">
                  <span className="section-icon">💪</span>
                  התרגילים שלי
                </h3>
                </div>

              <div className="exercises-content">
                {exercises.length === 0 ? (
                  <div className="empty-state">
                    <div className="empty-icon">💪</div>
                    <h3>אין תרגילים זמינים</h3>
                    <p>צור תרגילים חדשים בעמוד ניהול התרגילים</p>
                  </div>
                ) : (
                  <ExerciseGroupView
                    exercises={exercises}
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
                  {currentTraining.exercises.length} תרגילים
                </div>
              </div>

              <div className="training-exercises-content">
                {currentTraining.exercises.length === 0 ? (
                  <div className="empty-state">
                    <span className="empty-icon">🏋️</span>
                    <p>לא נבחרו תרגילים עדיין</p>
                    <p className="empty-subtitle">בחר תרגילים מהרשימה למעלה כדי להוסיף אותם לאימון</p>
                  </div>
                ) : (
                  <ExerciseGroupView
                    exercises={currentTraining.exercises}
                    renderExerciseCard={renderTrainingExerciseCard}
                  />
                )}
              </div>
            </div>
          </div>

          {/* Form Actions */}
              <div className="form-actions">
                <button 
                  type="button" 
                  onClick={saveTraining} 
              className="btn-primary"
              disabled={!currentTraining.name?.trim() || currentTraining.exercises.length === 0}
                >
              <span className="btn-icon">💾</span>
              הוסף אימון
                </button>
          </div>
        </div>
      </Modal>
      </div>

      {/* Exercise Parameter Modal - Higher Z-Index when within Training Form */}
      <div className={`exercise-parameter-modal-wrapper ${showParameterModal && showTrainingForm ? 'nested-modal' : ''}`}>
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
      </div>

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
            return (
              <Card 
                key={plan.planId} 
                data-id={plan.planId}
                variant="simple"
                title={plan.name}
                label={`${plan.trainingsCount} אימונים`}
                labelColor="purple"
                onEdit={() => handleEditPlan(plan)}
              />
            );
          })
        )}
      </div>


      {/* Edit Plan Modal - Same as Create Plan */}
      {editingPlan && (
        <Modal
          isOpen={!!editingPlan}
          onClose={() => setEditingPlan(null)}
          title="עריכת תוכנית"
          size="xl"
        >
          <div className="plan-modal-content">
            <form className="plan-form">
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
            </form>

            <Title level={3}>אימונים בתוכנית</Title>

            <div className="trainings-list">
              {formData.trainings.map((training, index) => (
                <Card
                  key={training.trainingId}
                  variant="simple"
                  title={`אימון ${training.name}`}
                  label={`${training.exercises.length} תרגילים`}
                  labelColor="purple"
                  onEdit={() => editTraining(training)}
                  onRemove={() => deleteTraining(training.trainingId)}
                />
              ))}
              
              {formData.trainings.length === 0 && (
                <div className="empty-trainings">
                  <p>עדיין לא נוספו אימונים לתוכנית</p>
                  <p>השתמש בכפתור "הוסף אימון" למטה כדי להתחיל</p>
                </div>
              )}
            </div>

            <div className="modal-actions">
              <button 
                type="button" 
                onClick={addTraining} 
                className="btn-purple"
              >
                ➕ הוסף אימון
              </button>
              <button 
                type="button" 
                onClick={handleSave} 
                className="btn-success"
                disabled={loading || !formData.name.trim() || formData.trainings.length === 0}
              >
                {loading ? 'שומר...' : 'שמור שינויים'}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default TrainingPlanManagement;
