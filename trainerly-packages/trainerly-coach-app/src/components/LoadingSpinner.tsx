import React from 'react';
import './LoadingSpinner.css';

interface LoadingSpinnerProps {
  message?: string;
  size?: 'small' | 'medium' | 'large';
  fullScreen?: boolean;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ 
  message = 'טוען...', 
  size = 'medium',
  fullScreen = false 
}) => {
  const containerClass = fullScreen ? 'loading-spinner-fullscreen' : 'loading-spinner-container';
  
  return (
    <div className={containerClass}>
      <div className="loading-spinner-content">
        <div className={`loading-spinner ${size}`}>
          <div className="spinner-ring">
            <div></div>
            <div></div>
            <div></div>
            <div></div>
          </div>
        </div>
        {message && (
          <p className="loading-message" dir="rtl">
            {message}
          </p>
        )}
      </div>
    </div>
  );
};

export default LoadingSpinner;
