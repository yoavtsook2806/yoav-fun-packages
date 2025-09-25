import React, { useState, useEffect } from 'react';
import { getVolume, saveVolume, internalToDisplayVolume, displayToInternalVolume, testSound } from '../utils/soundUtils';
import { APP_VERSION } from '../constants';

interface SettingsModalProps {
  onClose: () => void;
  onLogout: () => void;
  availablePlans: Array<{
    planId: string;
    name: string;
    isCurrent: boolean;
  }>;
  onPlanChange: (planId: string) => void;
}

const SettingsModal: React.FC<SettingsModalProps> = ({
  onClose,
  onLogout,
  availablePlans,
  onPlanChange
}) => {
  const [volume, setVolume] = useState(0);
  // Trainerly always shows coach app (hardcoded)

  useEffect(() => {
    // Load current volume setting
    const currentVolume = getVolume();
    setVolume(internalToDisplayVolume(currentVolume));
  }, []);

  const handleVolumeChange = (newVolume: number) => {
    setVolume(newVolume);
    const internalVolume = displayToInternalVolume(newVolume);
    saveVolume(internalVolume);
  };

  const handleTestSound = () => {
    testSound();
  };




  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content settings-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>הגדרות</h2>
          <button className="modal-close-btn" onClick={onClose}>×</button>
        </div>
        
        <div className="modal-body">
          {/* Training Plans */}
          {availablePlans.length > 1 && (
            <div className="settings-section">
              <h3>תוכניות אימונים</h3>
              <div className="plans-list">
                {availablePlans.map((plan) => (
                  <div
                    key={plan.planId}
                    className={`plan-option ${plan.isCurrent ? 'current' : ''}`}
                    onClick={() => onPlanChange(plan.planId)}
                  >
                    <div className="plan-info">
                      <span className="plan-name">{plan.name}</span>
                      {plan.isCurrent && <span className="current-badge">נוכחית</span>}
                    </div>
                    <div className="plan-action">
                      {plan.isCurrent ? '✓' : '→'}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Sound Settings */}
          <div className="settings-section">
            <div className="settings-item">
              <label className="settings-label">
                <span>עוצמת קול ({volume}%)</span>
                <div className="volume-control">
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={volume}
                    onChange={(e) => handleVolumeChange(parseInt(e.target.value))}
                    className="volume-slider"
                  />
                  <button 
                    className="test-sound-btn"
                    onClick={handleTestSound}
                    disabled={volume === 0}
                  >
                    🔊
                  </button>
                </div>
              </label>
              <p className="settings-description">
                עוצמת הקול עבור צלילי האימון (סיום סט וספירה לאחור)
              </p>
            </div>
          </div>

          {/* App Actions */}
          <div className="settings-section logout-section">
            <div className="settings-item">
              <button 
                className="danger-button logout-danger-button"
                onClick={onLogout}
              >
                🚪 התנתק מהמערכת
              </button>
              <p className="settings-description">
                התנתקות תחזיר אותך למסך הכניסה
              </p>
            </div>
          </div>
        </div>
        
        {/* App Version */}
        <div className="app-version">
          v{APP_VERSION}
        </div>
      </div>


    </div>
  );
};

export default SettingsModal;
