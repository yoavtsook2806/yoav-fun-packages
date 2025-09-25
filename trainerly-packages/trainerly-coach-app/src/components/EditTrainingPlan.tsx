import React, { useState, useEffect } from 'react';
import { cachedApiService, TrainingPlanSummary, Exercise, TrainingItem, PrescribedExercise } from '../services/cachedApiService';
import { showError, showSuccess } from './ToastContainer';
import LoadingSpinner from './LoadingSpinner';
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

      {/* Training Form Modal - would need to be implemented separately */}
      {showTrainingForm && currentTraining && (
        <div className="training-form-overlay">
          <div className="training-form-modal">
            <h3>{currentTraining.name ? 'עריכת אימון' : 'הוספת אימון חדש'}</h3>
            {/* Training form implementation would go here */}
            <button onClick={() => setShowTrainingForm(false)}>סגור</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default EditTrainingPlan;
