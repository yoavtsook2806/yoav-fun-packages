import React, { useState, useEffect } from 'react';
import { getAvailableVersions } from '../data/trainingPlans';
import { getVolume, saveVolume, internalToDisplayVolume, displayToInternalVolume, testSound } from '../utils/soundUtils';
import { APP_VERSION } from '../constants';

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
  const [volume, setVolume] = useState(0);

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

  const handleClearHistory = () => {
    const confirmed = window.confirm(
      'האם אתה בטוח שברצונך למחוק את כל ההיסטוריה של התרגילים?\n\nפעולה זו לא ניתנת לביטול.'
    );

    if (confirmed) {
      onClearAllHistory();
      onClose();
    }
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
        
        {/* App Version */}
        <div className="app-version">
          v{APP_VERSION}
        </div>
      </div>


    </div>
  );
};

export default SettingsModal;
