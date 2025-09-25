import React, { useState } from 'react';
import { getApiBaseUrl } from '../config/api';
import './AuthScreen.css';

interface Coach {
  coachId: string;
  name: string;
  email: string;
  nickname: string;
  valid: boolean;
  phone?: string;
  age?: number;
  createdAt: string;
}

interface AuthScreenProps {
  onLogin: (coach: Coach, token: string) => void;
}

const API_BASE = getApiBaseUrl();

const AuthScreen: React.FC<AuthScreenProps> = ({ onLogin }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Login form state
  const [loginData, setLoginData] = useState({
    email: '',
    password: ''
  });
  
  // Registration form state
  const [registerData, setRegisterData] = useState({
    name: '',
    email: '',
    password: '',
    nickname: ''
  });

  const [nicknameStatus, setNicknameStatus] = useState<{
    checking: boolean;
    available: boolean | null;
    message: string;
  }>({
    checking: false,
    available: null,
    message: ''
  });

  // Password visibility state
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [showRegisterPassword, setShowRegisterPassword] = useState(false);

  const checkNickname = async (nickname: string) => {
    if (!nickname.trim()) {
      setNicknameStatus({ checking: false, available: null, message: '' });
      return;
    }

    setNicknameStatus({ checking: true, available: null, message: '' });

    try {
      const response = await fetch(`${API_BASE}/nicknames/check?nickname=${encodeURIComponent(nickname)}`);
      const data = await response.json();

      if (response.ok) {
        setNicknameStatus({
          checking: false,
          available: data.available,
          message: data.available ? 
            `✅ "${data.canonical}" זמין` : 
            `❌ "${data.canonical}" ${data.reason === 'NICKNAME_TAKEN' ? 'כבר תפוס' : 'לא תקין'}`
        });
      } else {
        setNicknameStatus({
          checking: false,
          available: false,
          message: 'שגיאה בבדיקת הכינוי'
        });
      }
    } catch (error) {
      setNicknameStatus({
        checking: false,
        available: false,
        message: 'שגיאה בבדיקת הכינוי'
      });
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch(`${API_BASE}/auth/coach/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(loginData)
      });

      const data = await response.json();

      if (response.ok) {
        // Get full coach details
        const coachResponse = await fetch(`${API_BASE}/coaches/${data.coachId}`, {
          headers: {
            'Authorization': `Bearer ${data.token}`
          }
        });
        
        if (coachResponse.ok) {
          const coachData = await coachResponse.json();
          onLogin({
            coachId: data.coachId,
            name: coachData.name,
            email: coachData.email,
            nickname: coachData.nickname,
            valid: data.valid,
            phone: coachData.phone,
            age: coachData.age,
            createdAt: coachData.createdAt
          }, data.token);
        } else {
          // Fallback if coach details fetch fails
          onLogin({
            coachId: data.coachId,
            name: '',
            email: loginData.email,
            nickname: '',
            valid: data.valid,
            createdAt: new Date().toISOString()
          }, data.token);
        }
      } else {
        setError(data.message || 'שגיאה בהתחברות');
      }
    } catch (error) {
      setError('שגיאה בהתחברות לשרת');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!nicknameStatus.available) {
      setError('יש לבחור כינוי זמין');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch(`${API_BASE}/coaches`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(registerData)
      });

      const data = await response.json();

      if (response.ok) {
        onLogin({
          coachId: data.coachId,
          name: registerData.name,
          email: registerData.email,
          nickname: data.nickname,
          valid: data.valid,
          createdAt: new Date().toISOString()
        }, data.token);
      } else {
        setError(data.message || 'שגיאה ברישום');
      }
    } catch (error) {
      setError('שגיאה בהתחברות לשרת');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-screen">
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
              <p className="auth-subtitle">מערכת ניהול אימונים מקצועית</p>
            </div>
          </div>
          
          <div className="auth-tabs">
            <button 
              className={`tab-button ${isLogin ? 'active' : ''}`} 
              onClick={() => setIsLogin(true)}
            >
              <span className="tab-icon">🔑</span>
              התחברות
            </button>
            <button 
              className={`tab-button ${!isLogin ? 'active' : ''}`} 
              onClick={() => setIsLogin(false)}
            >
              <span className="tab-icon">✨</span>
              הרשמה
            </button>
          </div>

          {isLogin ? (
              <form onSubmit={handleLogin} className="auth-form" autoComplete="off" spellCheck="false">
              <div className="form-section">
                <h2 className="form-title">
                  <span className="form-icon">👋</span>
                  ברוכים השבים!
                </h2>
                <p className="form-description">התחברו לחשבון המאמן שלכם</p>
                
                <div className="input-group">
                  <div className="input-icon">📧</div>
                    <input
                      type="email"
                      placeholder="כתובת אימייל"
                      value={loginData.email}
                      onChange={(e) => setLoginData({...loginData, email: e.target.value})}
                      required
                      className="modern-input"
                      autoComplete="off"
                    spellCheck="false"
                    data-form-type="other"
                      spellCheck="false"
                      data-form-type="other"
                    />
                </div>
                
                <div className="input-group">
                  <div className="input-icon">🔒</div>
                  <input
                    type={showLoginPassword ? "text" : "password"}
                    placeholder="סיסמה"
                    value={loginData.password}
                    onChange={(e) => setLoginData({...loginData, password: e.target.value})}
                    required
                    className="modern-input password-input"
                    autoComplete="off"
                    spellCheck="false"
                    data-form-type="other"
                  />
                  <button
                    type="button"
                    className="password-toggle"
                    onClick={() => setShowLoginPassword(!showLoginPassword)}
                    tabIndex={-1}
                  >
                    {showLoginPassword ? '🙈' : '👁️'}
                  </button>
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
                      התחבר
                    </>
                  )}
                </button>
              </div>
            </form>
          ) : (
              <form onSubmit={handleRegister} className="auth-form" autoComplete="off" spellCheck="false">
              <div className="form-section">
                <h2 className="form-title">
                  <span className="form-icon">🌟</span>
                  הצטרפו אלינו!
                </h2>
                <p className="form-description">צרו חשבון מאמן חדש והתחילו לנהל את המתאמנים שלכם</p>
                
                <div className="input-group">
                  <div className="input-icon">👤</div>
                    <input
                      type="text"
                      placeholder="שם מלא"
                      value={registerData.name}
                      onChange={(e) => setRegisterData({...registerData, name: e.target.value})}
                      required
                      className="modern-input"
                      autoComplete="off"
                    spellCheck="false"
                    data-form-type="other"
                      spellCheck="false"
                      data-form-type="other"
                    />
                </div>
                
                <div className="input-group">
                  <div className="input-icon">📧</div>
                  <input
                    type="email"
                    placeholder="כתובת אימייל"
                    value={registerData.email}
                    onChange={(e) => setRegisterData({...registerData, email: e.target.value})}
                    required
                    className="modern-input"
                    autoComplete="off"
                    spellCheck="false"
                    data-form-type="other"
                  />
                </div>
                
                <div className="input-group">
                  <div className="input-icon">🏷️</div>
                  <input
                    type="text"
                    placeholder="כינוי (לזיהוי מתאמנים)"
                    value={registerData.nickname}
                    onChange={(e) => {
                      setRegisterData({...registerData, nickname: e.target.value});
                      // Check nickname availability with debouncing
                      setTimeout(() => checkNickname(e.target.value), 500);
                    }}
                    required
                    className="modern-input"
                    autoComplete="off"
                    spellCheck="false"
                    data-form-type="other"
                  />
                  {nicknameStatus.checking && (
                    <div className="nickname-status checking">
                      <span className="loading-spinner small"></span>
                      בודק זמינות...
                    </div>
                  )}
                  {nicknameStatus.message && (
                    <div className={`nickname-status ${nicknameStatus.available ? 'available' : 'unavailable'}`}>
                      <span className="status-icon">
                        {nicknameStatus.available ? '✅' : '❌'}
                      </span>
                      {nicknameStatus.message}
                    </div>
                  )}
                </div>
                
                <div className="input-group">
                  <div className="input-icon">🔒</div>
                  <input
                    type={showRegisterPassword ? "text" : "password"}
                    placeholder="סיסמה (לפחות 8 תווים)"
                    value={registerData.password}
                    onChange={(e) => setRegisterData({...registerData, password: e.target.value})}
                    required
                    minLength={8}
                    className="modern-input password-input"
                    autoComplete="off"
                    spellCheck="false"
                    data-form-type="other"
                  />
                  <button
                    type="button"
                    className="password-toggle"
                    onClick={() => setShowRegisterPassword(!showRegisterPassword)}
                    tabIndex={-1}
                  >
                    {showRegisterPassword ? '🙈' : '👁️'}
                  </button>
                </div>
                
                {error && (
                  <div className="error-message">
                    <span className="error-icon">⚠️</span>
                    {error}
                  </div>
                )}
                
                <button 
                  type="submit" 
                  disabled={loading || !nicknameStatus.available}
                  className="primary-button"
                >
                  {loading ? (
                    <>
                      <span className="loading-spinner"></span>
                      נרשם...
                    </>
                  ) : (
                    <>
                      <span className="button-icon">🎯</span>
                      הירשם
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
          
          <div className="auth-footer">
            <div className="feature-highlights">
              <div className="feature">
                <span className="feature-icon">📊</span>
                <span>ניהול מתאמנים</span>
              </div>
              <div className="feature">
                <span className="feature-icon">💪</span>
                <span>תוכניות אימון</span>
              </div>
              <div className="feature">
                <span className="feature-icon">📈</span>
                <span>מעקב התקדמות</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthScreen;
