import React from 'react';
import './SettingsModal.css';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onEditProfile: () => void;
  onLogout: () => void;
}

const SettingsModal: React.FC<SettingsModalProps> = ({ 
  isOpen, 
  onClose, 
  onEditProfile, 
  onLogout 
}) => {
  if (!isOpen) return null;

  const handleEditProfile = () => {
    onEditProfile();
    onClose();
  };

  const handleLogout = () => {
    onLogout();
    onClose();
  };

  return (
    <div className="settings-modal-overlay" onClick={onClose} dir="rtl">
      <div className="settings-modal" onClick={(e) => e.stopPropagation()}>
        <div className="settings-header">
          <h2 className="settings-title">
            <span className="settings-icon">⚙️</span>
            הגדרות
          </h2>
          <button 
            className="close-button" 
            onClick={onClose}
          >
            ✕
          </button>
        </div>
        
        <div className="settings-content">
          <div className="settings-options">
            <button 
              className="settings-option"
              onClick={handleEditProfile}
            >
              <div className="option-icon">👤</div>
              <div className="option-content">
                <div className="option-title">עריכת פרופיל</div>
                <div className="option-description">עדכן את הפרטים האישיים שלך</div>
              </div>
              <div className="option-arrow">←</div>
            </button>
            
            <button 
              className="settings-option danger"
              onClick={handleLogout}
            >
              <div className="option-icon">🚪</div>
              <div className="option-content">
                <div className="option-title">יציאה</div>
                <div className="option-description">התנתק מהחשבון</div>
              </div>
              <div className="option-arrow">←</div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;
