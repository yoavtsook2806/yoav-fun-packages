import React, { useState } from 'react';
import './AuthScreen.css';

interface AuthScreenProps {
  onAuthenticated: (traineeId: string, trainerName: string) => void;
}

const AuthScreen: React.FC<AuthScreenProps> = ({ onAuthenticated }) => {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [coachNickname, setCoachNickname] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // First, get the coach by nickname
      const coachResponse = await fetch(`https://f4xgifcx49.execute-api.eu-central-1.amazonaws.com/dev/nicknames/check?nickname=${encodeURIComponent(coachNickname)}`);
      
      if (!coachResponse.ok) {
        throw new Error('כינוי המאמן לא נמצא');
      }

      const coachData = await coachResponse.json();
      if (!coachData.available) {
        // Coach exists, get the coach ID
        // We need to find a way to get the coach ID from the nickname
        // For now, let's use a direct endpoint that returns coach info by nickname
        const coachInfoResponse = await fetch(`https://f4xgifcx49.execute-api.eu-central-1.amazonaws.com/dev/coaches/by-nickname/${encodeURIComponent(coachNickname)}`);
        
        if (!coachInfoResponse.ok) {
          throw new Error('שגיאה בקבלת פרטי המאמן');
        }

        const coachInfo = await coachInfoResponse.json();
        const coachId = coachInfo.coachId;

        // Now get all trainees for this coach
        const traineesResponse = await fetch(`https://f4xgifcx49.execute-api.eu-central-1.amazonaws.com/dev/coaches/${coachId}/trainers`);
        
        if (!traineesResponse.ok) {
          throw new Error('שגיאה בקבלת רשימת המתאמנים');
        }

        const traineesData = await traineesResponse.json();
        
        // Find the trainee by first and last name
        const matchingTrainee = traineesData.items?.find((trainee: any) => 
          trainee.firstName.toLowerCase() === firstName.toLowerCase() && 
          trainee.lastName.toLowerCase() === lastName.toLowerCase()
        );

        if (!matchingTrainee) {
          throw new Error('המתאמן לא נמצא במערכת. אנא בדקו את הפרטים או פנו למאמן שלכם.');
        }

        // Authentication successful
        onAuthenticated(matchingTrainee.trainerId, `${firstName} ${lastName}`);
      } else {
        throw new Error('כינוי המאמן לא נמצא במערכת');
      }
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
              <div className="logo-icon">💪</div>
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
                  placeholder="שם פרטי"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  required
                  className="modern-input"
                  inputMode="text"
                  autoComplete="given-name"
                />
              </div>
              
              <div className="input-group">
                <div className="input-icon">👤</div>
                <input
                  type="text"
                  placeholder="שם משפחה"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  required
                  className="modern-input"
                  inputMode="text"
                  autoComplete="family-name"
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
