import React, { useState, useEffect } from 'react';
import './styles/design-system.css';
import './App.css';

// Components
import AuthScreen from './components/AuthScreen';
import CoachDashboard from './components/CoachDashboard';
import { ToastContainer } from 'trainerly-ui-components';
import { getApiBaseUrl } from './config/api';

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
  // Version identifier for debugging
  console.log('🚀 COACH APP VERSION: v2.1.0-debug-env-fix');
  console.log('🔧 Environment detection - hostname:', window.location.hostname);
  console.log('🔧 API Base URL:', getApiBaseUrl());
  
  // Initialize auth state optimistically based on localStorage
  const [authState, setAuthState] = useState<AuthState>(() => {
    const savedToken = localStorage.getItem('coach_token');
    const savedCoach = localStorage.getItem('coach_data');
    
    if (savedToken && savedCoach) {
      try {
        const coachData = JSON.parse(savedCoach);
        console.log('🚀 Optimistically showing app with stored credentials');
        return {
          isAuthenticated: true,
          coach: coachData,
          token: savedToken
        };
      } catch (error) {
        console.error('Error parsing stored coach data:', error);
        // Clear invalid data immediately
        localStorage.removeItem('coach_token');
        localStorage.removeItem('coach_data');
      }
    }
    
    return {
      isAuthenticated: false,
      coach: null,
      token: null
    };
  });

  // Validate user exists in DB in the background
  useEffect(() => {
    const validateUserInBackground = async () => {
      const savedToken = localStorage.getItem('coach_token');
      const savedCoach = localStorage.getItem('coach_data');
      
      // Only validate if we have stored credentials
      if (savedToken && savedCoach && authState.isAuthenticated) {
        try {
          const coachData = JSON.parse(savedCoach);
          
          console.log('🔍 Background validation: checking if coach exists in database...');
          console.log('🔧 Background validation URL:', `${getApiBaseUrl()}/coaches/${coachData.coachId}`);
          console.log('🔧 Coach data from localStorage:', coachData);
          const response = await fetch(`${getApiBaseUrl()}/coaches/${coachData.coachId}`, {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
            },
          });

          if (response.ok) {
            const serverCoachData = await response.json();
            console.log('✅ Background validation successful');
            console.log('🔧 Server coach data:', serverCoachData);
            
            // Update local data with server data to get any updates
            const updatedCoachData = { ...coachData, ...serverCoachData };
            localStorage.setItem('coach_data', JSON.stringify(updatedCoachData));
            
            // Update state with fresh server data
            setAuthState(prevState => ({
              ...prevState,
              coach: updatedCoachData
            }));
          } else {
            console.log('❌ Background validation failed: coach no longer exists, logging out...');
            console.log('🔧 Response status:', response.status);
            try {
              const errorText = await response.text();
              console.log('🔧 Response text:', errorText);
            } catch (e) {
              console.log('🔧 Could not read response text');
            }
            // Coach doesn't exist anymore, clear auth and show login screen
            localStorage.removeItem('coach_token');
            localStorage.removeItem('coach_data');
            setAuthState({
              isAuthenticated: false,
              coach: null,
              token: null
            });
          }
        } catch (error) {
          console.error('Error in background validation:', error);
          // Clear invalid data and show login screen
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

    // Run validation in background after a brief delay to allow UI to render
    const timeoutId = setTimeout(validateUserInBackground, 100);
    return () => clearTimeout(timeoutId);
  }, [authState.isAuthenticated]);

  const handleLogin = (coach: Coach, token: string) => {
    console.log('🔧 handleLogin called with coach:', coach);
    console.log('🔧 handleLogin called with token:', token);
    
    setAuthState({
      isAuthenticated: true,
      coach,
      token
    });
    
    // Save to localStorage
    localStorage.setItem('coach_token', token);
    localStorage.setItem('coach_data', JSON.stringify(coach));
    
    console.log('🔧 Auth state updated and saved to localStorage');
    console.log('🔧 New auth state will be:', { isAuthenticated: true, coach, token });
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
