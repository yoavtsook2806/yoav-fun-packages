import React, { useState, useEffect } from 'react';
import { cachedApiService, Exercise } from '../services/cachedApiService';
import { showError, showSuccess } from './ToastContainer';
import LoadingSpinner from './LoadingSpinner';
import './AdminExerciseBank.css';

interface AdminExerciseBankProps {
  coachId: string;
  token: string;
  isOpen: boolean;
  onClose: () => void;
  onExerciseCopied?: (exercise: Exercise) => void;
}

const AdminExerciseBank: React.FC<AdminExerciseBankProps> = ({ 
  coachId, 
  token, 
  isOpen, 
  onClose, 
  onExerciseCopied 
}) => {
  const [adminExercises, setAdminExercises] = useState<Exercise[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [copying, setCopying] = useState<string | null>(null); // exerciseId being copied
  const [searchTerm, setSearchTerm] = useState<string>('');

  useEffect(() => {
    if (isOpen) {
      loadAdminExercises();
    }
  }, [isOpen]);

  const loadAdminExercises = async () => {
    try {
      setLoading(true);
      const result = await cachedApiService.getAdminExercises(token);
      setAdminExercises(result.data);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'שגיאה בטעינת בנק התרגילים';
      showError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleCopyExercise = async (adminExercise: Exercise) => {
    try {
      setCopying(adminExercise.exerciseId);
      const copiedExercise = await cachedApiService.copyAdminExercise(coachId, adminExercise.exerciseId, token);
      
      showSuccess(`תרגיל "${adminExercise.name}" הועתק בהצלחה!`);
      
      if (onExerciseCopied) {
        onExerciseCopied(copiedExercise);
      }
      
      // Close modal after successful copy
      onClose();
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'שגיאה בהעתקת התרגיל';
      showError(errorMsg);
    } finally {
      setCopying(null);
    }
  };

  const filteredExercises = adminExercises.filter(exercise =>
    exercise.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    exercise.short.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (!isOpen) return null;

  return (
    <div className="admin-exercise-bank-overlay">
      <div className="admin-exercise-bank-modal">
        <div className="modal-header">
          <h2>בנק התרגילים</h2>
          <button onClick={onClose} className="close-button">✕</button>
        </div>

        <div className="search-section">
          <input
            type="text"
            placeholder="חפש תרגיל..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
            dir="rtl"
          />
        </div>

        <div className="exercises-content">
          {loading ? (
            <LoadingSpinner message="טוען בנק התרגילים..." />
          ) : (
            <>
              {filteredExercises.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-icon">💪</div>
                  <h3>{searchTerm ? 'לא נמצאו תרגילים' : 'בנק התרגילים ריק'}</h3>
                  <p>{searchTerm ? 'נסה מילות חיפוש אחרות' : 'אין תרגילים זמינים בבנק'}</p>
                </div>
              ) : (
                <div className="exercises-grid">
                  {filteredExercises.map((exercise) => (
                    <div key={exercise.exerciseId} className="admin-exercise-card">
                      <div className="exercise-header">
                        <h3 className="exercise-name">{exercise.name}</h3>
                        <div className="admin-badge">מאמן מנהל</div>
                      </div>
                      
                      <p className="exercise-short">{exercise.short}</p>
                      
                      {exercise.note && (
                        <p className="exercise-note">{exercise.note}</p>
                      )}
                      
                      {exercise.link && (
                        <div className="exercise-link">
                          <a href={exercise.link} target="_blank" rel="noopener noreferrer">
                            🎥 צפה בסרטון
                          </a>
                        </div>
                      )}
                      
                      <div className="exercise-actions">
                        <button
                          onClick={() => handleCopyExercise(exercise)}
                          disabled={copying === exercise.exerciseId}
                          className="copy-exercise-btn"
                        >
                          {copying === exercise.exerciseId ? (
                            <>
                              <span className="loading-spinner-small"></span>
                              מעתיק...
                            </>
                          ) : (
                            <>
                              📋 העתק תרגיל
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminExerciseBank;
