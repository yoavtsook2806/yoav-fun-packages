import React, { useState } from 'react';
import './AuthScreen.css';

interface AuthScreenProps {
  onAuthenticated: (traineeId: string, trainerName: string, coachId?: string) => void;
}

const AuthScreen: React.FC<AuthScreenProps> = ({ onAuthenticated }) => {
  const [traineeNickname, setTraineeNickname] = useState('');
  const [coachNickname, setCoachNickname] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Use the trainer identification endpoint
      const identifyResponse = await fetch(`https://f4xgifcx49.execute-api.eu-central-1.amazonaws.com/dev/auth/trainer/identify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          coachNickname: coachNickname.trim(),
          traineeNickname: traineeNickname.trim()
        })
      });

      if (!identifyResponse.ok) {
        const errorData = await identifyResponse.json().catch(() => ({}));
        if (identifyResponse.status === 404) {
          throw new Error('מתאמן לא נמצא. אנא בדוק את הפרטים ונסה שוב.');
        } else if (identifyResponse.status === 400) {
          throw new Error('נתונים חסרים. אנא מלא את כל השדות.');
        } else {
          throw new Error(errorData.message || 'שגיאה בזיהוי המתאמן');
        }
      }

      const trainerData = await identifyResponse.json();
      onAuthenticated(trainerData.trainerId, traineeNickname, trainerData.coachId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'שגיאה לא צפויה');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-screen" dir="rtl">
      <div className="auth-background">
        <div className="auth-gradient"></div>
        <div className="auth-pattern"></div>
      </div>
      
      <div className="auth-container">
        <div className="auth-card">
          <div className="auth-header">
            <div className="auth-logo">
              <img
                src="/TrainerlyLogo.png"
                alt="Trainerly"
                className="trainerly-logo"
              />
              <h1>Trainerly</h1>
              <p className="auth-subtitle">אפליקציית המתאמנים</p>
            </div>
          </div>
          
          <form onSubmit={handleSubmit} className="auth-form">
            <div className="form-section">
              <h2 className="form-title">
                <span className="form-icon">👋</span>
                ברוכים הבאים!
              </h2>
              <p className="form-description">הזינו את הפרטים שלכם כדי להתחבר לאימונים</p>
              
              <div className="input-group">
                <div className="input-icon">👤</div>
                <input
                  type="text"
                  placeholder="כינוי המתאמן"
                  value={traineeNickname}
                  onChange={(e) => setTraineeNickname(e.target.value)}
                  required
                  className="modern-input"
                  inputMode="text"
                  autoComplete="username"
                />
              </div>
              
              <div className="input-group">
                <div className="input-icon">🏃‍♂️</div>
                <input
                  type="text"
                  placeholder="כינוי המאמן (לדוגמה: יואב123)"
                  value={coachNickname}
                  onChange={(e) => setCoachNickname(e.target.value)}
                  required
                  className="modern-input"
                  inputMode="text"
                  autoComplete="username"
                />
              </div>
              
              {error && (
                <div className="error-message">
                  <span className="error-icon">⚠️</span>
                  {error}
                </div>
              )}
              
              <button type="submit" disabled={loading} className="primary-button">
                {loading ? (
                  <>
                    <span className="loading-spinner"></span>
                    מתחבר...
                  </>
                ) : (
                  <>
                    <span className="button-icon">🚀</span>
                    התחבר לאימונים
                  </>
                )}
              </button>
            </div>
          </form>
          
          <div className="auth-footer">
            <div className="feature-highlights">
              <div className="feature">
                <span className="feature-icon">📊</span>
                <span>מעקב התקדמות</span>
              </div>
              <div className="feature">
                <span className="feature-icon">💪</span>
                <span>תוכניות אישיות</span>
              </div>
              <div className="feature">
                <span className="feature-icon">🎯</span>
                <span>הדרכה מקצועית</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthScreen;
