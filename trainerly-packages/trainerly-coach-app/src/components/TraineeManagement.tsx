import React, { useState, useEffect } from 'react';
import { cachedApiService, Trainee, TrainingPlanSummary } from '../services/cachedApiService';
import { showError, showSuccess } from './ToastContainer';
import CustomTraineePlanManager from './CustomTraineePlanManager';
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
  const [showCustomPlanManager, setShowCustomPlanManager] = useState(false);
  const [customPlanTrainee, setCustomPlanTrainee] = useState<Trainee | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    initialPlanId: '' // Plan to assign after creating trainee
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
      if (formData.initialPlanId) {
        await cachedApiService.assignPlanToTrainee(coachId, newTrainee.trainerId, formData.initialPlanId, token);
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
      initialPlanId: ''
    });
    setShowAddForm(false);
  };

  const assignPlan = async (trainee: Trainee, planId: string) => {
    try {
      console.log('🎯 CLIENT - Starting plan assignment:', {
        traineeId: trainee.trainerId,
        traineeName: `${trainee.firstName} ${trainee.lastName}`,
        planId,
        planName: getPlanName(planId),
        currentPlans: trainee.plans
      });
      
      setLoading(true);
      await cachedApiService.assignPlanToTrainee(coachId, trainee.trainerId, planId, token);
      
      console.log('✅ CLIENT - Plan assigned, refreshing data...');
      await loadData();
      
      console.log('🎉 CLIENT - Data refreshed successfully');
      setError(null);
      showSuccess(`תוכנית "${getPlanName(planId)}" הוקצתה בהצלחה ל${trainee.firstName} ${trainee.lastName}`);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to assign plan';
      console.error('❌ CLIENT - Plan assignment failed:', err);
      setError(errorMsg);
      showError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const viewProgress = async (trainee: Trainee) => {
    try {
      setLoading(true);
      // Force refresh to bypass cache - exercise sessions change frequently
      const sessionsResult = await cachedApiService.getTraineeExerciseSessions(coachId, trainee.trainerId, token, 50, { forceRefresh: true }); // Get last 50 sessions
      const sessions = sessionsResult.data;
      setTraineeProgress(sessions);
      setSelectedTrainee(trainee);
      setShowProgressModal(true);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load exercise history');
      showError(err instanceof Error ? err.message : 'Failed to load exercise history');
    } finally {
      setLoading(false);
    }
  };

  const openCustomPlanManager = (trainee: Trainee) => {
    setCustomPlanTrainee(trainee);
    setShowCustomPlanManager(true);
  };

  const closeCustomPlanManager = () => {
    setShowCustomPlanManager(false);
    setCustomPlanTrainee(null);
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
                  <div className="empty-icon">🏋️</div>
                  <h3>אין היסטוריית אימונים עדיין</h3>
                  <p>המתאמן עדיין לא השלים תרגילים</p>
                </div>
              ) : (
                <div className="progress-list">
                  {traineeProgress.map((session, index) => (
                    <div key={session.sessionId || index} className="progress-session">
                      <div className="session-header">
                        <h4>{session.exerciseName}</h4>
                        <span className="session-type">{session.trainingType}</span>
                      </div>
                      <div className="session-details">
                        <div className="session-meta">
                          <span className="session-date">
                            📅 {formatDate(session.completedAt)}
                          </span>
                          <span className="session-completion">
                            ✅ {session.completedSets}/{session.totalSets} סטים
                          </span>
                        </div>
                        {session.setsData && session.setsData.length > 0 && (
                          <div className="sets-data">
                            <h5>פרטי הסטים:</h5>
                            <div className="sets-grid">
                              {session.setsData.map((set: any, setIndex: number) => (
                                <div key={setIndex} className="set-item">
                                  <span className="set-number">#{setIndex + 1}</span>
                                  <span className="set-details">
                                    {set.weight ? `${set.weight}ק״ג` : ''} 
                                    {set.weight && set.repeats ? ' × ' : ''}
                                    {set.repeats ? `${set.repeats} חזרות` : ''}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                        {session.restTime && (
                          <div className="rest-time">
                            ⏱️ זמן מנוחה: {session.restTime} שניות
                          </div>
                        )}
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
                </div>
                <div className="trainee-actions">
                  <button 
                    onClick={() => openCustomPlanManager(trainee)} 
                    className="custom-plan-button"
                    title="תוכניות מותאמות"
                  >
                    👤
                  </button>
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
                  {trainee.plans && trainee.plans.length > 0 ? (
                    <span className="assigned-plan">{getPlanName(trainee.plans[trainee.plans.length - 1])}</span>
                  ) : (
                    <span className="no-plan">לא הוקצתה תוכנית</span>
                  )}
                </div>
                
                {trainee.plans && trainee.plans.length > 1 && (
                  <div className="plan-history">
                    <small style={{ color: '#64748b' }}>
                      תוכניות קודמות: {trainee.plans.slice(0, -1).map(planId => getPlanName(planId)).join(', ')}
                    </small>
                  </div>
                )}
                
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
                      .filter(plan => !trainee.plans || !trainee.plans.includes(plan.planId))
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

      {/* Custom Trainee Plan Manager Modal */}
      {customPlanTrainee && (
        <CustomTraineePlanManager
          coachId={coachId}
          token={token}
          trainee={customPlanTrainee}
          isOpen={showCustomPlanManager}
          onClose={closeCustomPlanManager}
        />
      )}
    </div>
  );
};

export default TraineeManagement;
