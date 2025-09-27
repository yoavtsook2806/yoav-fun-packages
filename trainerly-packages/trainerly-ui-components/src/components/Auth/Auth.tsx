import React, { useState } from 'react';
import Button from '../Button/Button';
import Input from '../Input/Input';
import './Auth.css';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  [key: string]: any; // Allow additional properties
}

export interface LoginData {
  email: string;
  password: string;
}

export interface RegisterData {
  name: string;
  email: string;
  password: string;
  [key: string]: any; // Allow additional fields
}

export interface AuthProps {
  onLogin: (data: LoginData) => Promise<void>;
  onRegister: (data: RegisterData) => Promise<void>;
  loading?: boolean;
  error?: string;
  logoSrc?: string;
  appName?: string;
  loginTitle?: string;
  registerTitle?: string;
  loginButtonText?: string;
  registerButtonText?: string;
  switchToRegisterText?: string;
  switchToLoginText?: string;
  additionalLoginFields?: React.ReactNode;
  additionalRegisterFields?: React.ReactNode;
  showPasswordToggle?: boolean;
  dir?: 'ltr' | 'rtl';
}

const Auth: React.FC<AuthProps> = ({
  onLogin,
  onRegister,
  loading = false,
  error = '',
  logoSrc,
  appName = 'Trainerly',
  loginTitle = 'התחברות',
  registerTitle = 'הרשמה',
  loginButtonText = 'התחבר',
  registerButtonText = 'הירשם',
  switchToRegisterText = 'אין לך חשבון? הירשם כאן',
  switchToLoginText = 'יש לך חשבון? התחבר כאן',
  additionalLoginFields,
  additionalRegisterFields,
  showPasswordToggle = true,
  dir = 'rtl'
}) => {
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  
  const [loginData, setLoginData] = useState<LoginData>({
    email: '',
    password: ''
  });
  
  const [registerData, setRegisterData] = useState<RegisterData>({
    name: '',
    email: '',
    password: ''
  });

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loading) {
      await onLogin(loginData);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loading) {
      await onRegister(registerData);
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const passwordIcon = showPasswordToggle ? (
    <button
      type="button"
      className="password-toggle"
      onClick={togglePasswordVisibility}
      tabIndex={-1}
    >
      {showPassword ? '🙈' : '👁️'}
    </button>
  ) : undefined;

  return (
    <div className="auth-container" dir={dir}>
      <div className="auth-card">
        {/* Header */}
        <div className="auth-header">
          {logoSrc && (
            <img src={logoSrc} alt={appName} className="auth-logo" />
          )}
          <h1 className="auth-app-name">{appName}</h1>
        </div>

        {/* Tabs */}
        <div className="auth-tabs">
          <button
            type="button"
            className={`auth-tab ${isLogin ? 'active' : ''}`}
            onClick={() => setIsLogin(true)}
          >
            {loginTitle}
          </button>
          <button
            type="button"
            className={`auth-tab ${!isLogin ? 'active' : ''}`}
            onClick={() => setIsLogin(false)}
          >
            {registerTitle}
          </button>
        </div>

        {/* Error Message */}
        {error && (
          <div className="auth-error" dir={dir}>
            {error}
          </div>
        )}

        {/* Login Form */}
        {isLogin ? (
          <form onSubmit={handleLoginSubmit} className="auth-form">
            <Input
              type="email"
              placeholder="אימייל"
              value={loginData.email}
              onChange={(e) => setLoginData({ ...loginData, email: e.target.value })}
              required
              fullWidth
              leftIcon="📧"
              dir={dir}
            />
            
            <Input
              type={showPassword ? 'text' : 'password'}
              placeholder="סיסמה"
              value={loginData.password}
              onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
              required
              fullWidth
              leftIcon="🔒"
              rightIcon={passwordIcon}
              dir={dir}
            />

            {additionalLoginFields}

            <Button
              type="submit"
              variant="success"
              size="large"
              fullWidth
              loading={loading}
            >
              {loginButtonText}
            </Button>

            <button
              type="button"
              className="auth-switch"
              onClick={() => setIsLogin(false)}
            >
              {switchToRegisterText}
            </button>
          </form>
        ) : (
          /* Register Form */
          <form onSubmit={handleRegisterSubmit} className="auth-form">
            <Input
              type="text"
              placeholder="שם מלא"
              value={registerData.name}
              onChange={(e) => setRegisterData({ ...registerData, name: e.target.value })}
              required
              fullWidth
              leftIcon="👤"
              dir={dir}
            />
            
            <Input
              type="email"
              placeholder="אימייל"
              value={registerData.email}
              onChange={(e) => setRegisterData({ ...registerData, email: e.target.value })}
              required
              fullWidth
              leftIcon="📧"
              dir={dir}
            />
            
            <Input
              type={showPassword ? 'text' : 'password'}
              placeholder="סיסמה"
              value={registerData.password}
              onChange={(e) => setRegisterData({ ...registerData, password: e.target.value })}
              required
              fullWidth
              leftIcon="🔒"
              rightIcon={passwordIcon}
              dir={dir}
            />

            {additionalRegisterFields}

            <Button
              type="submit"
              variant="success"
              size="large"
              fullWidth
              loading={loading}
            >
              {registerButtonText}
            </Button>

            <button
              type="button"
              className="auth-switch"
              onClick={() => setIsLogin(true)}
            >
              {switchToLoginText}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default Auth;
