import React, { useState, useEffect } from 'react';
import { getSoundSettings, saveSoundSettings } from '../utils/exerciseHistory';
import { soundManager } from '../utils/soundUtils';

interface SettingsModalProps {
  onClose: () => void;
  onClearAllHistory: () => void;
}

const SettingsModal: React.FC<SettingsModalProps> = ({ onClose, onClearAllHistory }) => {
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [volume, setVolume] = useState(50);

  useEffect(() => {
    // Load current sound settings
    const settings = getSoundSettings();
    setSoundEnabled(settings.enabled);
    setVolume(settings.volume || 50);
  }, []);

  const handleSoundToggle = () => {
    const newSoundEnabled = !soundEnabled;
    setSoundEnabled(newSoundEnabled);
    soundManager.setEnabled(newSoundEnabled);
    saveSoundSettings(newSoundEnabled, volume);
  };

  const handleVolumeChange = (newVolume: number) => {
    setVolume(newVolume);
    soundManager.setVolume(newVolume / 100); // Convert to 0-1 range
    saveSoundSettings(soundEnabled, newVolume);
    
    // Play a test beep when adjusting volume
    if (soundEnabled) {
      soundManager.playVolumeTestBeep();
    }
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
          {/* Sound Toggle */}
          <div className="settings-section">
            <div className="settings-item">
              <label className="settings-label">
                <span>צלילים</span>
                <div className="toggle-switch">
                  <input
                    type="checkbox"
                    checked={soundEnabled}
                    onChange={handleSoundToggle}
                    className="toggle-input"
                  />
                  <span className="toggle-slider"></span>
                </div>
              </label>
            </div>
          </div>

          {/* Volume Slider */}
          <div className="settings-section">
            <div className="settings-item">
              <label className="settings-label">
                <span>עוצמת קול</span>
                <div className="volume-control">
                  <span className="volume-icon">🔉</span>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={volume}
                    onChange={(e) => handleVolumeChange(Number(e.target.value))}
                    disabled={!soundEnabled}
                    className="volume-slider"
                  />
                  <span className="volume-icon">🔊</span>
                  <span className="volume-value">{volume}%</span>
                </div>
              </label>
            </div>
          </div>

          {/* Clear History Button */}
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
