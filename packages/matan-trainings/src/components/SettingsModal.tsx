import React from 'react';
import { getAvailableVersions } from '../data/trainingPlans';

interface SettingsModalProps {
  onClose: () => void;
  onClearAllHistory: () => void;
  currentTrainingPlanVersion: string;
  onTrainingPlanChange: (version: string) => void;
}

const SettingsModal: React.FC<SettingsModalProps> = ({
  onClose,
  onClearAllHistory,
  currentTrainingPlanVersion,
  onTrainingPlanChange
}) => {
  const availableVersions = getAvailableVersions();

  const handleClearHistory = () => {
    const confirmed = window.confirm(
      'האם אתה בטוח שברצונך למחוק את כל ההיסטוריה של התרגילים?\n\nפעולה זו לא ניתנת לביטול.'
    );

    if (confirmed) {
      onClearAllHistory();
      onClose();
    }
  };

  const handleSendLoveMessage = () => {
    const phoneNumber = '972546989899';
    const message = 'היי מתן! שלח לך הודעת אהבה מהאפליקציה 💪❤️';
    const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };


  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content settings-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>הגדרות</h2>
          <button className="modal-close-btn" onClick={onClose}>×</button>
        </div>
        
        <div className="modal-body">
          {/* Training Plan Selection */}
          <div className="settings-section">
            <div className="settings-item">
              <label className="settings-label">
                <span>תוכנית אימונים</span>
                <select
                  value={currentTrainingPlanVersion}
                  onChange={(e) => onTrainingPlanChange(e.target.value)}
                  className="training-plan-select"
                >
                  {availableVersions.map(version => (
                    <option key={version} value={version}>
                      גרסה {version}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          </div>

          {/* WhatsApp Integration */}
          <div className="settings-section">
            <div className="settings-item">
              <button
                className="whatsapp-button"
                onClick={handleSendLoveMessage}
              >
                📱 💚 שלח למתן הודעת אהבה
              </button>
              <p className="settings-description">
                שלח הודעת תמיכה ואהבה למתן דרך וואטסאפ
              </p>
            </div>
          </div>

          {/* App Actions */}
          <div className="settings-section">
            <div className="settings-item">
              <button 
                className="danger-button"
                onClick={handleClearHistory}
              >
                🗑️ מחק את כל ההיסטוריה
              </button>
              <p className="settings-description">
                פעולה זו תמחק את כל ההיסטוריה, ההתקדמות וההגדרות השמורות
              </p>
            </div>
          </div>
        </div>
      </div>


    </div>
  );
};

export default SettingsModal;
