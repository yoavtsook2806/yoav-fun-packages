import React, { useState, useEffect } from 'react';
import { cachedApiService, Trainee, TrainingPlanSummary } from '../services/cachedApiService';
import { showError, showSuccess } from './ToastContainer';
import './TraineeManagement.css';

interface TraineeManagementProps {
  coachId: string;
  token: string;
  onBack: () => void;
}

const TraineeManagement: React.FC<TraineeManagementProps> = ({ coachId, token, onBack }) => {
  const [trainees, setTrainees] = useState<Trainee[]>([]);
  const [plans, setPlans] = useState<TrainingPlanSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showProgressModal, setShowProgressModal] = useState(false);
  const [selectedTrainee, setSelectedTrainee] = useState<Trainee | null>(null);
  const [traineeProgress, setTraineeProgress] = useState<any[]>([]);

  // Form state
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    assignedPlanId: ''
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [traineeResult, planResult] = await Promise.all([
        cachedApiService.getTrainees(coachId, token),
        cachedApiService.getTrainingPlans(coachId, token)
      ]);
      
      setTrainees(traineeResult.data);
      setPlans(planResult.data);
      
      // Only show loading if both data sources didn't come from cache
      if (!traineeResult.fromCache || !planResult.fromCache) {
        setLoading(true);
      }
      
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      const newTrainee = await cachedApiService.createTrainee(coachId, token, formData);
      
      // If a plan was assigned, assign it
      if (formData.assignedPlanId) {
        await cachedApiService.assignPlanToTrainee(coachId, newTrainee.trainerId, formData.assignedPlanId, token);
      }
      
      await loadData();
      resetForm();
      setError(null);
      showSuccess('מתאמן חדש נוסף בהצלחה!');
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'שגיאה בהוספת המתאמן';
      setError(errorMsg);
      showError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      firstName: '',
      lastName: '',
      email: '',
      assignedPlanId: ''
    });
    setShowAddForm(false);
  };

  const assignPlan = async (trainee: Trainee, planId: string) => {
    try {
      setLoading(true);
      await cachedApiService.assignPlanToTrainee(coachId, trainee.trainerId, planId, token);
      await loadData();
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to assign plan');
    } finally {
      setLoading(false);
    }
  };

  const viewProgress = async (trainee: Trainee) => {
    try {
      setLoading(true);
      const progressResult = await cachedApiService.getTraineeProgress(coachId, trainee.trainerId, token);
      const progress = progressResult.data;
      setTraineeProgress(progress);
      setSelectedTrainee(trainee);
      setShowProgressModal(true);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load progress');
    } finally {
      setLoading(false);
    }
  };

  const getPlanName = (planId: string) => {
    const plan = plans.find(p => p.planId === planId);
    return plan?.name || 'תוכנית לא נמצאה';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('he-IL');
  };


  if (loading && trainees.length === 0) {
    return (
      <div className="trainee-management">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>טוען מתאמנים...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="trainee-management" dir="rtl">
      <div className="management-header">
        <button onClick={onBack} className="back-button">
          ← חזרה לדשבורד
        </button>
        <div className="header-content">
          <h1 className="page-title">
            <span className="title-icon">👥</span>
            ניהול מתאמנים
          </h1>
          <button 
            onClick={() => setShowAddForm(true)} 
            className="add-button"
            disabled={loading}
          >
            <span className="button-icon">➕</span>
            הוסף מתאמן חדש
          </button>
        </div>
      </div>

      {error && (
        <div className="error-message">
          <span className="error-icon">⚠️</span>
          {error}
        </div>
      )}

      {/* Add Trainee Modal */}
      {showAddForm && (
        <div className="modal-overlay">
          <div className="trainee-form-modal">
            <div className="modal-header">
              <h2>הוספת מתאמן חדש</h2>
              <button onClick={resetForm} className="close-button">✕</button>
            </div>
            
            <form onSubmit={handleSubmit} className="trainee-form">
              <div className="form-row">
                <div className="form-group">
                  <label>שם פרטי *</label>
                  <input
                    type="text"
                    value={formData.firstName}
                    onChange={(e) => setFormData(prev => ({ ...prev, firstName: e.target.value }))}
                    required
                    placeholder="שם פרטי"
                  />
                </div>
                <div className="form-group">
                  <label>שם משפחה *</label>
                  <input
                    type="text"
                    value={formData.lastName}
                    onChange={(e) => setFormData(prev => ({ ...prev, lastName: e.target.value }))}
                    required
                    placeholder="שם משפחה"
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>אימייל</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="כתובת אימייל"
                  />
                </div>
                <div className="form-group">
                  {/* Empty for now - keeping consistent layout */}
                </div>
              </div>

              <div className="form-group">
                <label>הקצאת תוכנית אימון</label>
                <select
                  value={formData.assignedPlanId}
                  onChange={(e) => setFormData(prev => ({ ...prev, assignedPlanId: e.target.value }))}
                >
                  <option value="">בחר תוכנית (אופציונלי)</option>
                  {plans.map((plan) => (
                    <option key={plan.planId} value={plan.planId}>
                      {plan.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-actions">
                <button type="button" onClick={resetForm} className="cancel-button">
                  ביטול
                </button>
                <button type="submit" className="save-button" disabled={loading}>
                  {loading ? 'שומר...' : 'הוסף מתאמן'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Progress Modal */}
      {showProgressModal && selectedTrainee && (
        <div className="modal-overlay">
          <div className="progress-modal">
            <div className="modal-header">
              <h2>התקדמות - {selectedTrainee.firstName} {selectedTrainee.lastName}</h2>
              <button onClick={() => setShowProgressModal(false)} className="close-button">✕</button>
            </div>
            
            <div className="progress-content">
              {traineeProgress.length === 0 ? (
                <div className="empty-progress">
                  <div className="empty-icon">📊</div>
                  <h3>אין נתוני התקדמות עדיין</h3>
                  <p>המתאמן עדיין לא החל באימונים</p>
                </div>
              ) : (
                <div className="progress-list">
                  {traineeProgress.map((session, index) => (
                    <div key={index} className="progress-session">
                      <div className="session-header">
                        <h4>אימון מתאריך {formatDate(session.date)}</h4>
                        <span className="session-type">{session.trainingType}</span>
                      </div>
                      <div className="session-exercises">
                        {session.exercises?.map((exercise: any, exIndex: number) => (
                          <div key={exIndex} className="exercise-progress">
                            <span className="exercise-name">{exercise.name}</span>
                            <span className="exercise-performance">
                              {exercise.sets}×{exercise.reps} - {exercise.weight}ק״ג
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Trainees Grid */}
      <div className="trainees-grid">
        {trainees.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">👥</div>
            <h3>אין מתאמנים עדיין</h3>
            <p>התחל בהוספת המתאמן הראשון שלך</p>
            <button onClick={() => setShowAddForm(true)} className="empty-action-button">
              הוסף מתאמן ראשון
            </button>
          </div>
        ) : (
          trainees.map((trainee) => (
            <div key={trainee.trainerId} className="trainee-card">
              <div className="trainee-header">
                <div className="trainee-info">
                  <h3 className="trainee-name">{trainee.firstName} {trainee.lastName}</h3>
                  {trainee.trainerCode && (
                    <span className="trainee-age">קוד: {trainee.trainerCode}</span>
                  )}
                </div>
                <div className="trainee-actions">
                  <button 
                    onClick={() => viewProgress(trainee)} 
                    className="progress-button"
                    title="צפה בהתקדמות"
                  >
                    📊
                  </button>
                </div>
              </div>
              
              <div className="trainee-details">
                {trainee.email && (
                  <div className="detail-item">
                    <span className="detail-icon">📧</span>
                    <span className="detail-text">{trainee.email}</span>
                  </div>
                )}
                <div className="detail-item">
                  <span className="detail-icon">📅</span>
                  <span className="detail-text">נרשם ב-{formatDate(trainee.createdAt)}</span>
                </div>
              </div>
              
              <div className="plan-assignment">
                <div className="current-plan">
                  <strong>תוכנית נוכחית:</strong>
                  {trainee.assignedPlanId ? (
                    <span className="assigned-plan">{getPlanName(trainee.assignedPlanId)}</span>
                  ) : (
                    <span className="no-plan">לא הוקצתה תוכנית</span>
                  )}
                </div>
                
                <div className="plan-actions">
                  <select
                    onChange={(e) => {
                      if (e.target.value) {
                        assignPlan(trainee, e.target.value);
                        e.target.value = '';
                      }
                    }}
                    className="plan-selector"
                    disabled={loading}
                  >
                    <option value="">הקצה תוכנית...</option>
                    {plans
                      .filter(plan => plan.planId !== trainee.assignedPlanId)
                      .map((plan) => (
                        <option key={plan.planId} value={plan.planId}>
                          {plan.name}
                        </option>
                      ))}
                  </select>
                </div>
              </div>
              
              <div className="trainee-access">
                <div className="access-info">
                  <strong>פרטי כניסה לאפליקציה:</strong>
                  <div className="access-details">
                    <span>שם: <code>{trainee.firstName} {trainee.lastName}</code></span>
                    <span>כינוי מאמן: <code>1</code></span>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default TraineeManagement;
