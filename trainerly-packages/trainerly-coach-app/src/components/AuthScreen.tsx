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
      console.log('🔧 REGISTRATION DEBUG - Version: v2.1.0-debug-env-fix');
      console.log('🔧 Registering coach with data:', registerData);
      console.log('🔧 API_BASE:', API_BASE);
      console.log('🔧 Full registration URL:', `${API_BASE}/coaches`);
      console.log('🔧 Request payload:', JSON.stringify(registerData, null, 2));
      const response = await fetch(`${API_BASE}/coaches`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(registerData)
      });

      const data = await response.json();
      console.log('🔧 Registration response status:', response.status);
      console.log('🔧 Registration response headers:', Object.fromEntries(response.headers.entries()));
      console.log('🔧 Registration response data:', data);
      console.log('🔧 Registration success:', response.ok);

      if (response.ok) {
        const coachData = {
          coachId: data.coachId,
          name: registerData.name,
          email: registerData.email,
          nickname: data.nickname,
          valid: data.valid,
          createdAt: new Date().toISOString()
        };
        console.log('🔧 Calling onLogin with coach data:', coachData);
        console.log('🔧 Calling onLogin with token:', data.token);
        onLogin(coachData, data.token);
      } else {
        console.error('🔧 Registration failed:', data);
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
              <img
                src="./TrainerlyLogo.png"
                alt="Trainerly"
                className="trainerly-logo"
              />
              <h1>Trainerly Coach</h1>
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
              <form onSubmit={handleLogin} className="auth-form">
              <div className="form-section">
                <div className="input-group">
                  <div className="input-icon">📧</div>
                  <input
                    type="email"
                    placeholder="כתובת אימייל"
                    value={loginData.email}
                    onChange={(e) => setLoginData({...loginData, email: e.target.value})}
                    required
                    className="modern-input"
                    inputMode="email"
                    autoComplete="email"
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
                    inputMode="text"
                    autoComplete="current-password"
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
                
                <button type="submit" disabled={loading || !loginData.email.trim() || !loginData.password.trim()} className="btn-primary auth-button">
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
              <form onSubmit={handleRegister} className="auth-form">
              <div className="form-section">
                <div className="input-group">
                  <div className="input-icon">👤</div>
                    <input
                      type="text"
                      placeholder="שם מלא"
                      value={registerData.name}
                      onChange={(e) => setRegisterData({...registerData, name: e.target.value})}
                      required
                      className="modern-input"
                    inputMode="text"
                    autoComplete="name"
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
                    inputMode="email"
                    autoComplete="email"
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
                    inputMode="text"
                    autoComplete="username"
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
                    inputMode="text"
                    autoComplete="new-password"
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
                  className="btn-primary auth-button"
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
