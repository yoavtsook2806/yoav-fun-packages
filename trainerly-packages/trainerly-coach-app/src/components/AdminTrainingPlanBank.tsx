import React, { useState, useEffect } from 'react';
import { cachedApiService, TrainingPlanSummary } from '../services/cachedApiService';
import { showError, showSuccess } from './ToastContainer';
import LoadingSpinner from './LoadingSpinner';
import './AdminTrainingPlanBank.css';

interface AdminTrainingPlanBankProps {
  coachId: string;
  token: string;
  isOpen: boolean;
  onClose: () => void;
  onPlanCopied?: (plan: TrainingPlanSummary) => void;
}

const AdminTrainingPlanBank: React.FC<AdminTrainingPlanBankProps> = ({ 
  coachId, 
  token, 
  isOpen, 
  onClose, 
  onPlanCopied 
}) => {
  const [adminPlans, setAdminPlans] = useState<TrainingPlanSummary[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [copying, setCopying] = useState<string | null>(null); // planId being copied
  const [searchTerm, setSearchTerm] = useState<string>('');

  useEffect(() => {
    if (isOpen) {
      loadAdminPlans();
    }
  }, [isOpen]);

  const loadAdminPlans = async () => {
    try {
      setLoading(true);
      const result = await cachedApiService.getAdminTrainingPlans(token);
      setAdminPlans(result.data);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'שגיאה בטעינת בנק תוכניות האימון';
      showError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleCopyPlan = async (adminPlan: TrainingPlanSummary) => {
    try {
      setCopying(adminPlan.planId);
      const copiedPlan = await cachedApiService.copyAdminTrainingPlan(coachId, adminPlan.planId, token);
      
      showSuccess(`תוכנית "${adminPlan.name}" הועתקה בהצלחה!`);
      
      if (onPlanCopied) {
        const planSummary: TrainingPlanSummary = {
          planId: copiedPlan.planId,
          name: copiedPlan.name,
          description: copiedPlan.description,
          trainingsCount: copiedPlan.trainings.length,
          isAdminPlan: copiedPlan.isAdminPlan,
          originalPlanId: copiedPlan.originalPlanId,
          customTrainee: copiedPlan.customTrainee,
          createdAt: copiedPlan.createdAt
        };
        onPlanCopied(planSummary);
      }
      
      // Close modal after successful copy
      onClose();
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'שגיאה בהעתקת תוכנית האימון';
      showError(errorMsg);
    } finally {
      setCopying(null);
    }
  };

  const filteredPlans = adminPlans.filter(plan =>
    plan.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (plan.description && plan.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  if (!isOpen) return null;

  return (
    <div className="admin-plan-bank-overlay">
      <div className="admin-plan-bank-modal">
        <div className="modal-header">
          <h2>בנק תוכניות האימון</h2>
          <button onClick={onClose} className="close-button">✕</button>
        </div>

        <div className="search-section">
          <input
            type="text"
            placeholder="חפש תוכנית אימון..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
            dir="rtl"
          />
        </div>

        <div className="plans-content">
          {loading ? (
            <LoadingSpinner message="טוען בנק תוכניות האימון..." />
          ) : (
            <>
              {filteredPlans.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-icon">📋</div>
                  <h3>{searchTerm ? 'לא נמצאו תוכניות' : 'בנק תוכניות האימון ריק'}</h3>
                  <p>{searchTerm ? 'נסה מילות חיפוש אחרות' : 'אין תוכניות זמינות בבנק'}</p>
                </div>
              ) : (
                <div className="plans-grid">
                  {filteredPlans.map((plan) => (
                    <div key={plan.planId} className="admin-plan-card">
                      <div className="plan-header">
                        <h3 className="plan-name">{plan.name}</h3>
                        <div className="admin-badge">מאמן מנהל</div>
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
                      
                      <div className="plan-created">
                        <span className="created-date">נוצר ב-{new Date(plan.createdAt).toLocaleDateString('he-IL')}</span>
                      </div>
                      
                      <div className="plan-actions">
                        <button
                          onClick={() => handleCopyPlan(plan)}
                          disabled={copying === plan.planId}
                          className="copy-plan-btn"
                        >
                          {copying === plan.planId ? (
                            <>
                              <span className="loading-spinner-small"></span>
                              מעתיק...
                            </>
                          ) : (
                            <>
                              📋 העתק תוכנית
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminTrainingPlanBank;
