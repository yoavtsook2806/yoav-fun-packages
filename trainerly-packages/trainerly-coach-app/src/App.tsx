import React, { useState, useEffect } from 'react';
import './App.css';

// Components
import AuthScreen from './components/AuthScreen';
import CoachDashboard from './components/CoachDashboard';

// Types
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

interface AuthState {
  isAuthenticated: boolean;
  coach: Coach | null;
  token: string | null;
}

const App: React.FC = () => {
  const [authState, setAuthState] = useState<AuthState>({
    isAuthenticated: false,
    coach: null,
    token: null
  });

  // Check for existing auth on app load
  useEffect(() => {
    const savedToken = localStorage.getItem('coach_token');
    const savedCoach = localStorage.getItem('coach_data');
    
    if (savedToken && savedCoach) {
      try {
        const coachData = JSON.parse(savedCoach);
        setAuthState({
          isAuthenticated: true,
          coach: coachData,
          token: savedToken
        });
      } catch (error) {
        console.error('Error parsing saved coach data:', error);
        // Clear invalid data
        localStorage.removeItem('coach_token');
        localStorage.removeItem('coach_data');
      }
    }
  }, []);

  const handleLogin = (coach: Coach, token: string) => {
    setAuthState({
      isAuthenticated: true,
      coach,
      token
    });
    
    // Save to localStorage
    localStorage.setItem('coach_token', token);
    localStorage.setItem('coach_data', JSON.stringify(coach));
  };

  const handleLogout = () => {
    setAuthState({
      isAuthenticated: false,
      coach: null,
      token: null
    });
    
    // Clear localStorage
    localStorage.removeItem('coach_token');
    localStorage.removeItem('coach_data');
  };

  return (
    <div className="app">
      {!authState.isAuthenticated ? (
        <AuthScreen onLogin={handleLogin} />
      ) : (
        <CoachDashboard 
          coachId={authState.coach!.coachId}
          token={authState.token!}
          onLogout={handleLogout}
        />
      )}
    </div>
  );
};

export default App;
