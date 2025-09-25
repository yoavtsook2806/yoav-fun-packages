import React, { useState } from 'react';

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

const API_BASE = 'https://f4xgifcx49.execute-api.eu-central-1.amazonaws.com/dev';

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
      <div className="auth-container">
        <h1>🏋️ מערכת ניהול אימונים למאמנים</h1>
        
        <div className="auth-tabs">
          <button 
            className={isLogin ? 'active' : ''} 
            onClick={() => setIsLogin(true)}
          >
            התחברות
          </button>
          <button 
            className={!isLogin ? 'active' : ''} 
            onClick={() => setIsLogin(false)}
          >
            הרשמה
          </button>
        </div>

        {isLogin ? (
          <form onSubmit={handleLogin} className="auth-form">
            <h2>התחברות</h2>
            
            <div className="form-group">
              <label>אימייל:</label>
              <input
                type="email"
                value={loginData.email}
                onChange={(e) => setLoginData({...loginData, email: e.target.value})}
                required
              />
            </div>
            
            <div className="form-group">
              <label>סיסמה:</label>
              <input
                type="password"
                value={loginData.password}
                onChange={(e) => setLoginData({...loginData, password: e.target.value})}
                required
              />
            </div>
            
            {error && <div className="error">{error}</div>}
            
            <button type="submit" disabled={loading}>
              {loading ? 'מתחבר...' : 'התחבר'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleRegister} className="auth-form">
            <h2>הרשמה</h2>
            
            <div className="form-group">
              <label>שם מלא:</label>
              <input
                type="text"
                value={registerData.name}
                onChange={(e) => setRegisterData({...registerData, name: e.target.value})}
                required
              />
            </div>
            
            <div className="form-group">
              <label>אימייל:</label>
              <input
                type="email"
                value={registerData.email}
                onChange={(e) => setRegisterData({...registerData, email: e.target.value})}
                required
              />
            </div>
            
            <div className="form-group">
              <label>כינוי (לזיהוי מתאמנים):</label>
              <input
                type="text"
                value={registerData.nickname}
                onChange={(e) => {
                  setRegisterData({...registerData, nickname: e.target.value});
                  // Check nickname availability with debouncing
                  setTimeout(() => checkNickname(e.target.value), 500);
                }}
                required
              />
              {nicknameStatus.checking && <div className="nickname-status">בודק...</div>}
              {nicknameStatus.message && (
                <div className={`nickname-status ${nicknameStatus.available ? 'available' : 'unavailable'}`}>
                  {nicknameStatus.message}
                </div>
              )}
            </div>
            
            <div className="form-group">
              <label>סיסמה:</label>
              <input
                type="password"
                value={registerData.password}
                onChange={(e) => setRegisterData({...registerData, password: e.target.value})}
                required
                minLength={8}
              />
            </div>
            
            {error && <div className="error">{error}</div>}
            
            <button 
              type="submit" 
              disabled={loading || !nicknameStatus.available}
            >
              {loading ? 'נרשם...' : 'הירשם'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default AuthScreen;
