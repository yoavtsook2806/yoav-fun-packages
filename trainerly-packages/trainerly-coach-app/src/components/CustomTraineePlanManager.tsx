import React, { useState, useEffect } from 'react';
import { cachedApiService, TrainingPlanSummary, Trainee } from '../services/cachedApiService';
import { showError, showSuccess } from './ToastContainer';
import LoadingSpinner from './LoadingSpinner';
import './CustomTraineePlanManager.css';

interface CustomTraineePlanManagerProps {
  coachId: string;
  token: string;
  trainee: Trainee;
  isOpen: boolean;
  onClose: () => void;
}

const CustomTraineePlanManager: React.FC<CustomTraineePlanManagerProps> = ({ 
  coachId, 
  token, 
  trainee, 
  isOpen, 
  onClose 
}) => {
  const [coachPlans, setCoachPlans] = useState<TrainingPlanSummary[]>([]);
  const [customPlans, setCustomPlans] = useState<TrainingPlanSummary[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [creating, setCreating] = useState<string | null>(null); // planId being used to create custom plan
  const [makingGeneric, setMakingGeneric] = useState<string | null>(null); // planId being made generic

  useEffect(() => {
    if (isOpen) {
      loadData();
    }
  }, [isOpen, trainee.trainerId]);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Load both coach's generic plans and trainee's custom plans
      const [plansResult, customPlansResult] = await Promise.all([
        cachedApiService.getTrainingPlans(coachId, token),
        cachedApiService.getTraineeCustomPlans(coachId, trainee.trainerId, token)
      ]);
      
      // Filter out custom plans from generic plans (customTrainee should be null/undefined for generic)
      const genericPlans = plansResult.data.filter(plan => !plan.customTrainee);
      setCoachPlans(genericPlans);
      setCustomPlans(customPlansResult.data);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'שגיאה בטעינת תוכניות האימון';
      showError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCustomPlan = async (basePlan: TrainingPlanSummary) => {
    try {
      setCreating(basePlan.planId);
      
      const customPlan = await cachedApiService.createCustomTrainingPlan(
        coachId, 
        trainee.trainerId, 
        `${trainee.firstName} ${trainee.lastName}`,
        basePlan.planId, 
        token
      );
      
      showSuccess(`תוכנית מותאמת "${customPlan.name}" נוצרה עבור ${trainee.firstName}!`);
      
      // Refresh data to show the new custom plan
      await loadData();
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'שגיאה ביצירת תוכנית מותאמת';
      showError(errorMsg);
    } finally {
      setCreating(null);
    }
  };

  const handleMakeGeneric = async (customPlan: TrainingPlanSummary) => {
    try {
      setMakingGeneric(customPlan.planId);
      
      await cachedApiService.makeCustomPlanGeneric(coachId, customPlan.planId, token);
      
      showSuccess(`תוכנית "${customPlan.name}" הפכה לכללית ותופיע בניהול תוכניות האימון!`);
      
      // Refresh data
      await loadData();
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'שגיאה בהפיכת התוכנית לכללית';
      showError(errorMsg);
    } finally {
      setMakingGeneric(null);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="custom-trainee-plan-overlay">
      <div className="custom-trainee-plan-modal">
        <div className="modal-header">
          <h2>תוכניות אימון עבור {trainee.firstName} {trainee.lastName}</h2>
          <button onClick={onClose} className="close-button">✕</button>
        </div>

        <div className="plans-content">
          {loading ? (
            <LoadingSpinner message="טוען תוכניות אימון..." />
          ) : (
            <div className="plans-sections">
              {/* Custom Plans for this Trainee */}
              <div className="plans-section">
                <h3 className="section-title">
                  <span className="section-icon">👤</span>
                  תוכניות מותאמות עבור {trainee.firstName}
                </h3>
                
                {customPlans.length === 0 ? (
                  <div className="empty-section">
                    <p>עדיין לא נוצרו תוכניות מותאמות עבור {trainee.firstName}</p>
                  </div>
                ) : (
                  <div className="plans-grid">
                    {customPlans.map((plan) => (
                      <div key={plan.planId} className="plan-card custom-plan">
                        <div className="plan-header">
                          <h4 className="plan-name">{plan.name}</h4>
                          <div className="custom-badge">מותאם</div>
                        </div>
                        
                        {plan.description && (
                          <p className="plan-description">{plan.description}</p>
                        )}
                        
                        <div className="plan-stats">
                          <div className="stat">
                            <span className="stat-number">{plan.trainingsCount}</span>
                            <span className="stat-label">אימונים</span>
                          </div>
                        </div>
                        
                        <div className="plan-actions">
                          <button
                            onClick={() => handleMakeGeneric(plan)}
                            disabled={makingGeneric === plan.planId}
                            className="make-generic-btn"
                            title="הפוך לתוכנית כללית"
                          >
                            {makingGeneric === plan.planId ? (
                              <>
                                <span className="loading-spinner-small"></span>
                                מעביר...
                              </>
                            ) : (
                              <>
                                🌐 הפוך לכללית
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Generic Plans Available for Customization */}
              <div className="plans-section">
                <h3 className="section-title">
                  <span className="section-icon">📋</span>
                  צור תוכנית מותאמת מתוכנית קיימת
                </h3>
                
                {coachPlans.length === 0 ? (
                  <div className="empty-section">
                    <p>אין תוכניות כלליות זמינות. צור תוכנית חדשה בניהול תוכניות האימון.</p>
                  </div>
                ) : (
                  <div className="plans-grid">
                    {coachPlans.map((plan) => (
                      <div key={plan.planId} className="plan-card generic-plan">
                        <div className="plan-header">
                          <h4 className="plan-name">{plan.name}</h4>
                          <div className="generic-badge">כללית</div>
                        </div>
                        
                        {plan.description && (
                          <p className="plan-description">{plan.description}</p>
                        )}
                        
                        <div className="plan-stats">
                          <div className="stat">
                            <span className="stat-number">{plan.trainingsCount}</span>
                            <span className="stat-label">אימונים</span>
                          </div>
                        </div>
                        
                        <div className="plan-actions">
                          <button
                            onClick={() => handleCreateCustomPlan(plan)}
                            disabled={creating === plan.planId}
                            className="create-custom-btn"
                          >
                            {creating === plan.planId ? (
                              <>
                                <span className="loading-spinner-small"></span>
                                יוצר...
                              </>
                            ) : (
                              <>
                                👤 צור מותאם עבור {trainee.firstName}
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CustomTraineePlanManager;
