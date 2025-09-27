import React, { useState, useEffect } from 'react';
import { cachedApiService, Coach } from '../services/cachedApiService';
import { showError, showSuccess } from './ToastContainer';
import Modal from './Modal';
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
  const [countryCode, setCountryCode] = useState<string>('972');
  const [phoneNumber, setPhoneNumber] = useState<string>('');
  const [age, setAge] = useState<string>(coach.age?.toString() || '');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<boolean>(false);

  useEffect(() => {
    if (isOpen) {
      setName(coach.name);

      // Parse existing phone number
      if (coach.phone) {
        const phoneStr = coach.phone.replace(/[-\s]/g, ''); // Remove dashes and spaces
        if (phoneStr.startsWith('972')) {
          setCountryCode('972');
          setPhoneNumber(phoneStr.substring(3));
        } else if (phoneStr.startsWith('+972')) {
          setCountryCode('972');
          setPhoneNumber(phoneStr.substring(4));
        } else if (phoneStr.startsWith('0')) {
          setCountryCode('972');
          setPhoneNumber(phoneStr.substring(1));
        } else {
          setCountryCode('972');
          setPhoneNumber(phoneStr);
        }
      } else {
        setCountryCode('972');
        setPhoneNumber('');
      }

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

      if (phoneNumber.trim()) {
        // Combine country code and phone number
        const fullPhone = `+${countryCode}${phoneNumber.trim()}`;
        updateData.phone = fullPhone;
      }
      
      if (age.trim()) {
        const ageNum = parseInt(age.trim());
        if (isNaN(ageNum) || ageNum < 18 || ageNum > 120) {
          const errorMsg = 'הגיל חייב להיות מספר בין 18 ל-120';
          setError(errorMsg);
          showError(errorMsg);
          setLoading(false);
          return;
        }
        updateData.age = ageNum;
      }

      console.log('Updating coach profile:', updateData);
      
      const updatedCoach = await cachedApiService.updateCoach(coach.coachId, token, updateData);
      
      setSuccess(true);
      onUpdate(updatedCoach);
      showSuccess('הפרופיל עודכן בהצלחה!');
      
      setTimeout(() => {
        onClose();
      }, 1500);
      
    } catch (err: any) {
      const errorMsg = err.message || 'שגיאה בעדכון הפרופיל';
      setError(errorMsg);
      showError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="עריכת פרופיל"
      icon="⚙️"
      size="md"
    >
      {success && (
        <div className="success-message">
          <span className="success-icon">✅</span>
          הפרופיל עודכן בהצלחה!
        </div>
      )}

      <form onSubmit={handleSubmit} className="profile-form profile-modal">
        <div className="form-group">
          <label className="form-label">שם מלא *</label>
          <div className="input-group">
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              placeholder="הכנס שם מלא"
              className="modal-input"
            />
            <div className="input-icon">👤</div>
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">מספר טלפון</label>
          <div className="phone-input-container">
            <div className="country-selector">
              <select
                value={countryCode}
                onChange={(e) => setCountryCode(e.target.value)}
                className="country-select"
              >
                <option value="972">🇮🇱 +972</option>
                <option value="1">🇺🇸 +1</option>
                <option value="44">🇬🇧 +44</option>
                <option value="33">🇫🇷 +33</option>
                <option value="49">🇩🇪 +49</option>
                <option value="39">🇮🇹 +39</option>
                <option value="34">🇪🇸 +34</option>
                <option value="31">🇳🇱 +31</option>
                <option value="41">🇨🇭 +41</option>
                <option value="43">🇦🇹 +43</option>
              </select>
            </div>
            <div className="phone-number-input">
              <input
                type="tel"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="50-123-4567"
                className="modal-input phone-input"
              />
              <div className="input-icon">📱</div>
            </div>
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">גיל</label>
          <div className="input-group">
            <input
              type="number"
              value={age}
              onChange={(e) => setAge(e.target.value)}
              min="18"
              max="120"
              placeholder="35"
              className="modal-input"
            />
            <div className="input-icon">🎂</div>
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

        <div className="button-group justify-end">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="btn-secondary"
          >
            <span className="btn-icon">❌</span>
            ביטול
          </button>
          <button
            type="submit"
            disabled={loading || success}
            className={`btn-primary ${success ? 'btn-success' : ''}`}
          >
            {loading ? (
              <>
                <span className="loading-spinner small"></span>
                מעדכן...
              </>
            ) : success ? (
              <>
                <span className="btn-icon">✅</span>
                עודכן!
              </>
            ) : (
              <>
                <span className="btn-icon">💾</span>
                עדכן פרופיל
              </>
            )}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default ProfileModal;
