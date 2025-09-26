import React, { useState, useEffect } from 'react';
import './styles/design-system.css';
import './App.css';

// Components
import AuthScreen from './components/AuthScreen';
import CoachDashboard from './components/CoachDashboard';
import ToastContainer from './components/ToastContainer';

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

  // Check for existing auth on app load and validate user exists in DB
  useEffect(() => {
    const validateAndRestoreAuth = async () => {
      const savedToken = localStorage.getItem('coach_token');
      const savedCoach = localStorage.getItem('coach_data');
      
      if (savedToken && savedCoach) {
        try {
          const coachData = JSON.parse(savedCoach);
          
          // Validate that the coach still exists in the database
          console.log('🔍 Validating coach exists in database...');
          const response = await fetch(`https://f4xgifcx49.execute-api.eu-central-1.amazonaws.com/dev/coaches/${coachData.coachId}`, {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
            },
          });

          if (response.ok) {
            const serverCoachData = await response.json();
            console.log('✅ Coach validation successful');
            
            // Update local data with server data to get any updates
            const updatedCoachData = { ...coachData, ...serverCoachData };
            localStorage.setItem('coach_data', JSON.stringify(updatedCoachData));
            
            setAuthState({
              isAuthenticated: true,
              coach: updatedCoachData,
              token: savedToken
            });
          } else {
            console.log('❌ Coach no longer exists in database, logging out...');
            // Coach doesn't exist anymore, clear auth
            localStorage.removeItem('coach_token');
            localStorage.removeItem('coach_data');
            setAuthState({
              isAuthenticated: false,
              coach: null,
              token: null
            });
          }
        } catch (error) {
          console.error('Error validating coach auth:', error);
          // Clear invalid data on any error
          localStorage.removeItem('coach_token');
          localStorage.removeItem('coach_data');
          setAuthState({
            isAuthenticated: false,
            coach: null,
            token: null
          });
        }
      }
    };

    validateAndRestoreAuth();
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
    <ToastContainer>
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
    </ToastContainer>
  );
};

export default App;
