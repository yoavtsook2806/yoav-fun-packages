import React, { useState, useEffect } from 'react';
import ProfileModal from './ProfileModal';
import './CoachDashboard.css';

interface Coach {
  coachId: string;
  name: string;
  email: string;
  nickname: string;
  phone?: string;
  age?: number;
  createdAt: string;
  valid: boolean;
}

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

  useEffect(() => {
    loadCoachProfile();
  }, [coachId]);

  const loadCoachProfile = async () => {
    try {
      setLoading(true);
      // TODO: Replace with actual API service call
      console.log('Loading coach profile for:', coachId);
      
      // Mock API call for now
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Mock coach data
      const mockCoach: Coach = {
        coachId,
        name: 'Demo Coach',
        email: 'demo@example.com',
        nickname: 'demo_coach',
        phone: '+972-50-123-4567',
        age: 35,
        createdAt: new Date().toISOString(),
        valid: true
      };
      
      setCoach(mockCoach);
    } catch (err: any) {
      setError(err.message || 'Failed to load coach profile');
    } finally {
      setLoading(false);
    }
  };

  const handleProfileUpdate = (updatedCoach: Coach) => {
    setCoach(updatedCoach);
  };

  if (loading) {
    return (
      <div className="dashboard-loading">
        <div className="loading-container">
          <div className="loading-spinner-large"></div>
          <div className="loading-text">טוען פרופיל מאמן...</div>
        </div>
      </div>
    );
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
    <div className="coach-dashboard" dir="rtl">
      <div className="dashboard-background">
        <div className="dashboard-gradient"></div>
      </div>
      
      {/* Header */}
      <header className="dashboard-header">
        <div className="header-content">
          <div className="header-info">
            <div className="welcome-section">
              <h1 className="welcome-title">
                <span className="welcome-icon">👋</span>
                שלום, {coach.name}!
              </h1>
              <p className="welcome-subtitle">
                <span className="dashboard-icon">📊</span>
                דשבורד מאמן • @{coach.nickname}
              </p>
            </div>
            <div className="coach-status">
              <div className="status-badge active">
                <span className="status-dot"></span>
                פעיל
              </div>
            </div>
          </div>
          <div className="header-actions">
            <button
              onClick={() => setIsProfileModalOpen(true)}
              className="action-button secondary"
            >
              <span className="button-icon">⚙️</span>
              עריכת פרופיל
            </button>
            <button
              onClick={onLogout}
              className="action-button danger"
            >
              <span className="button-icon">🚪</span>
              יציאה
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="dashboard-main">
        {/* Quick Stats */}
        <section className="stats-section">
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-icon">👥</div>
              <div className="stat-content">
                <div className="stat-number">0</div>
                <div className="stat-label">מתאמנים</div>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon">💪</div>
              <div className="stat-content">
                <div className="stat-number">0</div>
                <div className="stat-label">תוכניות אימון</div>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon">📊</div>
              <div className="stat-content">
                <div className="stat-number">0</div>
                <div className="stat-label">אימונים השבוע</div>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon">🏆</div>
              <div className="stat-content">
                <div className="stat-number">0</div>
                <div className="stat-label">יעדים הושגו</div>
              </div>
            </div>
          </div>
        </section>

        {/* Profile Summary */}
        <section className="profile-section">
          <div className="section-card">
            <div className="section-header">
              <h2 className="section-title">
                <span className="section-icon">👤</span>
                הפרופיל שלך
              </h2>
            </div>
            <div className="profile-grid">
              <div className="profile-field">
                <div className="field-icon">📧</div>
                <div className="field-content">
                  <div className="field-label">אימייל</div>
                  <div className="field-value">{coach.email}</div>
                </div>
              </div>
              <div className="profile-field">
                <div className="field-icon">📱</div>
                <div className="field-content">
                  <div className="field-label">טלפון</div>
                  <div className="field-value">{coach.phone || 'לא צוין'}</div>
                </div>
              </div>
              <div className="profile-field">
                <div className="field-icon">🎂</div>
                <div className="field-content">
                  <div className="field-label">גיל</div>
                  <div className="field-value">{coach.age || 'לא צוין'}</div>
                </div>
              </div>
              <div className="profile-field">
                <div className="field-icon">📅</div>
                <div className="field-content">
                  <div className="field-label">חבר מאז</div>
                  <div className="field-value">{new Date(coach.createdAt).toLocaleDateString('he-IL')}</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Management Sections */}
        <section className="management-section">
          <div className="section-header">
            <h2 className="section-title">
              <span className="section-icon">⚡</span>
              ניהול מהיר
            </h2>
          </div>
          <div className="management-grid">
            <div className="management-card coming-soon">
              <div className="card-icon">👥</div>
              <div className="card-content">
                <h3 className="card-title">ניהול מתאמנים</h3>
                <p className="card-description">הוספה וניהול של המתאמנים שלך</p>
                <div className="card-features">
                  <div className="feature-item">✨ יצירת פרופילים</div>
                  <div className="feature-item">📊 מעקב התקדמות</div>
                  <div className="feature-item">📱 התראות</div>
                </div>
                <button className="card-button disabled">
                  <span className="button-icon">🚀</span>
                  בקרוב
                </button>
              </div>
            </div>

            <div className="management-card coming-soon">
              <div className="card-icon">💪</div>
              <div className="card-content">
                <h3 className="card-title">ספריית תרגילים</h3>
                <p className="card-description">יצירה ועריכה של בסיס נתוני תרגילים</p>
                <div className="card-features">
                  <div className="feature-item">🎯 תרגילים מותאמים</div>
                  <div className="feature-item">📹 סרטוני הדרכה</div>
                  <div className="feature-item">⚙️ הגדרות קושי</div>
                </div>
                <button className="card-button disabled">
                  <span className="button-icon">🚀</span>
                  בקרוב
                </button>
              </div>
            </div>

            <div className="management-card coming-soon">
              <div className="card-icon">📋</div>
              <div className="card-content">
                <h3 className="card-title">תוכניות אימון</h3>
                <p className="card-description">יצירה והקצאה של תוכניות אימון מותאמות</p>
                <div className="card-features">
                  <div className="feature-item">📝 תוכניות מותאמות</div>
                  <div className="feature-item">📈 מעקב ביצועים</div>
                  <div className="feature-item">🔄 עדכונים אוטומטיים</div>
                </div>
                <button className="card-button disabled">
                  <span className="button-icon">🚀</span>
                  בקרוב
                </button>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Profile Modal */}
      <ProfileModal
        coach={coach}
        token={token}
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        onUpdate={handleProfileUpdate}
      />
    </div>
  );
};

export default CoachDashboard;
