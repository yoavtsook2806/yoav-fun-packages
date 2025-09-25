import React, { useState, useEffect } from 'react';
import { apiService, Coach } from '../services/apiService';
import './ProfileModal.css';

interface ProfileModalProps {
  coach: Coach;
  token: string;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (updatedCoach: Coach) => void;
}

const ProfileModal: React.FC<ProfileModalProps> = ({ 
  coach, 
  token, 
  isOpen, 
  onClose, 
  onUpdate 
}) => {
  const [name, setName] = useState<string>(coach.name);
  const [phone, setPhone] = useState<string>(coach.phone || '');
  const [age, setAge] = useState<string>(coach.age?.toString() || '');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<boolean>(false);

  useEffect(() => {
    if (isOpen) {
      setName(coach.name);
      setPhone(coach.phone || '');
      setAge(coach.age?.toString() || '');
      setError(null);
      setSuccess(false);
    }
  }, [isOpen, coach]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const updateData: any = { name };
      
      if (phone.trim()) {
        updateData.phone = phone.trim();
      }
      
      if (age.trim()) {
        const ageNum = parseInt(age.trim());
        if (isNaN(ageNum) || ageNum < 18 || ageNum > 120) {
          setError('Age must be a number between 18 and 120');
          setLoading(false);
          return;
        }
        updateData.age = ageNum;
      }

      console.log('Updating coach profile:', updateData);
      
      const updatedCoach = await apiService.updateCoach(coach.coachId, token, updateData);
      
      setSuccess(true);
      onUpdate(updatedCoach);
      
      setTimeout(() => {
        onClose();
      }, 1500);
      
    } catch (err: any) {
      setError(err.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="profile-modal-overlay" dir="rtl">
      <div className="profile-modal">
        <div className="modal-header">
          <h2 className="modal-title">
            <span className="modal-icon">⚙️</span>
            עריכת פרופיל
          </h2>
          <button onClick={onClose} className="close-button">
            <span className="close-icon">✕</span>
          </button>
        </div>

        {success && (
          <div className="success-message">
            <span className="success-icon">✅</span>
            הפרופיל עודכן בהצלחה!
          </div>
        )}

        <form onSubmit={handleSubmit} className="profile-form">
          <div className="form-group">
            <div className="input-group">
              <div className="input-icon">👤</div>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                placeholder="שם מלא *"
                className="modal-input"
              />
            </div>
          </div>

          <div className="form-group">
            <div className="input-group">
              <div className="input-icon">📱</div>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="מספר טלפון (לדוגמה: 050-123-4567)"
                className="modal-input"
              />
            </div>
          </div>

          <div className="form-group">
            <div className="input-group">
              <div className="input-icon">🎂</div>
              <input
                type="number"
                value={age}
                onChange={(e) => setAge(e.target.value)}
                min="18"
                max="120"
                placeholder="גיל (לדוגמה: 35)"
                className="modal-input"
              />
            </div>
          </div>

          <div className="form-group">
            <div className="readonly-field">
              <div className="field-icon">📧</div>
              <div className="field-content">
                <div className="field-label">אימייל (לקריאה בלבד)</div>
                <div className="field-value">{coach.email}</div>
              </div>
            </div>
          </div>

          <div className="form-group">
            <div className="readonly-field">
              <div className="field-icon">🏷️</div>
              <div className="field-content">
                <div className="field-label">כינוי (לקריאה בלבד)</div>
                <div className="field-value">@{coach.nickname}</div>
              </div>
            </div>
          </div>

          {error && (
            <div className="error-message">
              <span className="error-icon">⚠️</span>
              {error}
            </div>
          )}

          <div className="modal-actions">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="modal-button secondary"
            >
              <span className="button-icon">❌</span>
              ביטול
            </button>
            <button
              type="submit"
              disabled={loading || success}
              className={`modal-button primary ${success ? 'success' : ''}`}
            >
              {loading ? (
                <>
                  <span className="loading-spinner small"></span>
                  מעדכן...
                </>
              ) : success ? (
                <>
                  <span className="button-icon">✅</span>
                  עודכן!
                </>
              ) : (
                <>
                  <span className="button-icon">💾</span>
                  עדכן פרופיל
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProfileModal;
