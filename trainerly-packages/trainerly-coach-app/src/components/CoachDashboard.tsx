import React, { useState, useEffect } from 'react';
import ProfileModal from './ProfileModal';
import SettingsModal from './SettingsModal';
import ExerciseManagement from './ExerciseManagement';
import TrainingPlanManagement from './TrainingPlanManagement';
import TraineeManagement from './TraineeManagement';
import Modal from './Modal';
import { cachedApiService, Coach } from '../services/cachedApiService';
import { showError } from './ToastContainer';
import LoadingSpinner from './LoadingSpinner';
import '../styles/design-system.css';
import './CoachDashboard.css';

interface CoachDashboardProps {
  coachId: string;
  token: string;
  onLogout: () => void;
}

const CoachDashboard: React.FC<CoachDashboardProps> = ({ 
  coachId, 
  token, 
  onLogout 
}) => {
  const [coach, setCoach] = useState<Coach | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState<boolean>(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState<boolean>(false);
  const [activeSection, setActiveSection] = useState<'dashboard' | 'exercises' | 'plans' | 'trainees'>('dashboard');

  useEffect(() => {
    loadCoachProfile();

    // Listen for cache updates
    const handleCacheUpdate = (event: CustomEvent) => {
      const { cacheKey, coachId: updatedCoachId, data } = event.detail;
      if (updatedCoachId === coachId && cacheKey === 'profile') {
        console.log('🔄 Coach profile updated from background sync');
        setCoach(data);
      }
    };

    window.addEventListener('cacheUpdated', handleCacheUpdate as EventListener);
    
    return () => {
      window.removeEventListener('cacheUpdated', handleCacheUpdate as EventListener);
    };
  }, [coachId]);

  const loadCoachProfile = async () => {
    try {
      console.log('Loading coach profile for:', coachId);
      
      const result = await cachedApiService.getCoach(coachId, token, { backgroundUpdate: true });
      setCoach(result.data);
      
      // Only show loading if data came from cache
      if (!result.fromCache) {
        setLoading(true);
      }
      
      setError(null);
    } catch (err: any) {
      console.error('Failed to load coach profile:', err);
      const errorMsg = err.message || 'שגיאה בטעינת פרופיל המאמן';
      setError(errorMsg);
      showError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleProfileUpdate = (updatedCoach: Coach) => {
    setCoach(updatedCoach);
  };

  if (loading) {
    return <LoadingSpinner message="טוען פרופיל המאמן..." fullScreen={true} />;
  }

  if (error) {
    return (
      <div className="dashboard-error">
        <div className="error-container">
          <div className="error-icon">⚠️</div>
          <div className="error-text">שגיאה: {error}</div>
          <button onClick={loadCoachProfile} className="retry-button">
            <span className="button-icon">🔄</span>
            נסה שוב
          </button>
        </div>
      </div>
    );
  }

  if (!coach) {
    return (
      <div className="dashboard-error">
        <div className="error-container">
          <div className="error-icon">❌</div>
          <div className="error-text">פרופיל מאמן לא נמצא</div>
        </div>
      </div>
    );
  }

  return (
    <div className="coach-dashboard" dir="rtl" data-testid="coach-dashboard">
      <div className="dashboard-background">
        <div className="dashboard-gradient"></div>
      </div>
      

        {/* Main Content */}
        <main className="dashboard-main">
          <div className="header-actions">
            <button
              onClick={() => setIsSettingsModalOpen(true)}
              className="action-button settings"
              title="הגדרות"
            >
              <span className="button-icon">⚙️</span>
            </button>
          </div>

          {activeSection === 'dashboard' && (
            <>
              {/* Trainerly Logo */}
              <section className="logo-section">
                <div className="logo-container">
                  <img 
                    src="./TrainerlyLogo.png" 
                    alt="Trainerly" 
                    className="trainerly-logo"
                  />
                  <h1 className="app-title">Trainerly Coach</h1>
                  <p className="app-subtitle">פלטפורמת ניהול אימונים מתקדמת</p>
                </div>
              </section>
              
              {/* Simple Management Buttons */}
              <section className="simple-management-section">
                <div className="simple-management-grid">
                  <button
                    className="simple-manage-button"
                    onClick={() => setActiveSection('exercises')}
                  >
                    <div className="manage-card-actions">
                      <button 
                        className="manage-action-button"
                        onClick={(e) => {
                          e.stopPropagation();
                          // Could add quick actions here
                        }}
                        title="הגדרות מהירות"
                      >
                        ⚙️
                      </button>
                      <button 
                        className="manage-action-button"
                        onClick={(e) => {
                          e.stopPropagation();
                          // Could add info here
                        }}
                        title="מידע נוסף"
                      >
                        ℹ️
                      </button>
                    </div>
                    <div className="simple-button-icon">💪</div>
                    <div className="manage-card-divider"></div>
                    <div className="simple-button-text">ניהול תרגילים</div>
                  </button>

                  <button
                    className="simple-manage-button"
                    onClick={() => setActiveSection('plans')}
                  >
                    <div className="manage-card-actions">
                      <button 
                        className="manage-action-button"
                        onClick={(e) => {
                          e.stopPropagation();
                          // Could add quick actions here
                        }}
                        title="הגדרות מהירות"
                      >
                        ⚙️
                      </button>
                      <button 
                        className="manage-action-button"
                        onClick={(e) => {
                          e.stopPropagation();
                          // Could add info here
                        }}
                        title="מידע נוסף"
                      >
                        ℹ️
                      </button>
                    </div>
                    <div className="simple-button-icon">📋</div>
                    <div className="manage-card-divider"></div>
                    <div className="simple-button-text">תוכניות אימון</div>
                  </button>

                  <button
                    className="simple-manage-button"
                    onClick={() => setActiveSection('trainees')}
                  >
                    <div className="manage-card-actions">
                      <button 
                        className="manage-action-button"
                        onClick={(e) => {
                          e.stopPropagation();
                          // Could add quick actions here
                        }}
                        title="הגדרות מהירות"
                      >
                        ⚙️
                      </button>
                      <button 
                        className="manage-action-button"
                        onClick={(e) => {
                          e.stopPropagation();
                          // Could add info here
                        }}
                        title="מידע נוסף"
                      >
                        ℹ️
                      </button>
                    </div>
                    <div className="simple-button-icon">👥</div>
                    <div className="manage-card-divider"></div>
                    <div className="simple-button-text">ניהול מתאמנים</div>
                  </button>

                </div>
              </section>
            </>
          )}

        </main>

      <Modal
        isOpen={activeSection === 'exercises'}
        onClose={() => setActiveSection('dashboard')}
        title="ניהול תרגילים"
        icon="💪"
        size="xl"
      >
        {coach && (
          <ExerciseManagement
            coachId={coachId}
            token={token}
            coach={coach}
            onBack={() => setActiveSection('dashboard')}
          />
        )}
      </Modal>

      <Modal
        isOpen={activeSection === 'plans'}
        onClose={() => setActiveSection('dashboard')}
        title="ניהול תוכניות אימון"
        icon="📋"
        size="xl"
      >
        {coach && (
          <TrainingPlanManagement
            coachId={coachId}
            token={token}
            coach={coach}
            onBack={() => setActiveSection('dashboard')}
          />
        )}
      </Modal>

      <Modal
        isOpen={activeSection === 'trainees'}
        onClose={() => setActiveSection('dashboard')}
        title="ניהול מתאמנים"
        icon="👥"
        size="xl"
      >
        <TraineeManagement
          coachId={coachId}
          token={token}
          onBack={() => setActiveSection('dashboard')}
        />
      </Modal>

      {/* Profile Modal */}
      <ProfileModal
        coach={coach}
        token={token}
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        onUpdate={handleProfileUpdate}
      />
      
      {/* Settings Modal */}
      <SettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        onEditProfile={() => setIsProfileModalOpen(true)}
        onLogout={onLogout}
      />
    </div>
  );
};

export default CoachDashboard;
