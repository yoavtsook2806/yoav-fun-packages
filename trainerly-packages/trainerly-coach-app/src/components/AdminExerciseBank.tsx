import React, { useState, useEffect } from 'react';
import { cachedApiService, Exercise } from '../services/cachedApiService';
import { showError, showSuccess } from './ToastContainer';
import LoadingSpinner from './LoadingSpinner';
import Modal from './Modal';
import './AdminExerciseBank.css';
import './Card.css';

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
  const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set());
  const [editingExercise, setEditingExercise] = useState<Exercise | null>(null);
  const [copiedExercises, setCopiedExercises] = useState<Set<string>>(new Set());

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

  const handleCopyExercise = (adminExercise: Exercise) => {
    // Open edit modal instead of copying directly
    setEditingExercise(adminExercise);
  };

  const handleCopyWithEdits = async (exerciseData: Omit<Exercise, 'exerciseId' | 'coachId' | 'createdAt'>) => {
    if (!editingExercise) return;

    try {
      setCopying(editingExercise.exerciseId);
      const copiedExercise = await cachedApiService.copyAdminExercise(
        coachId, 
        editingExercise.exerciseId, 
        token,
        exerciseData
      );

      showSuccess(`תרגיל "${exerciseData.name}" הועתק בהצלחה!`);

      // Mark exercise as copied
      setCopiedExercises(prev => new Set([...prev, editingExercise.exerciseId]));

      if (onExerciseCopied) {
        onExerciseCopied(copiedExercise);
      }

      // Close edit modal
      setEditingExercise(null);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'שגיאה בהעתקת התרגיל';
      showError(errorMsg);
    } finally {
      setCopying(null);
    }
  };

  const handleCancelEdit = () => {
    setEditingExercise(null);
  };

  const toggleCardExpansion = (exerciseId: string) => {
    const newExpandedCards = new Set(expandedCards);
    if (expandedCards.has(exerciseId)) {
      newExpandedCards.delete(exerciseId);
    } else {
      newExpandedCards.add(exerciseId);
    }
    setExpandedCards(newExpandedCards);
  };

  const filteredExercises = adminExercises.filter(exercise =>
    exercise.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (exercise.muscleGroup && exercise.muscleGroup.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="בנק התרגילים"
      icon="🏦"
      size="xl"
    >
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
                {filteredExercises.map((exercise) => {
                  const isExpanded = expandedCards.has(exercise.exerciseId);
                  return (
                    <div key={exercise.exerciseId} className={`card card-hoverable ${isExpanded ? 'card-expanded' : 'card-collapsed'}`}>
                      <div className="card-header">
                        <div 
                          className="card-header-content"
                          onClick={() => toggleCardExpansion(exercise.exerciseId)}
                        >
                          <h3 className="card-title">{exercise.name}</h3>
                          <p className="card-subtitle">🎯 {exercise.muscleGroup}</p>
                        </div>
                        <div className="card-actions">
                          <div className="admin-badge">מאמן מנהל</div>
                          <button 
                            className="card-action-button"
                            onClick={() => toggleCardExpansion(exercise.exerciseId)}
                            title={isExpanded ? 'כווץ תרגיל' : 'הרחב תרגיל'}
                          >
                            {isExpanded ? '🔽' : '🔼'}
                          </button>
                        </div>
                      </div>

                      {isExpanded && (
                        <div className="card-content">
                          {exercise.note && (
                            <div className="exercise-note">
                              <p>{exercise.note}</p>
                            </div>
                          )}

                          {exercise.link && (
                            <div className="exercise-link">
                              <a href={exercise.link} target="_blank" rel="noopener noreferrer">
                                🎥 צפה בסרטון
                              </a>
                            </div>
                          )}
                        </div>
                      )}

                      {isExpanded && (
                        <div className="card-footer">
                          <div className="card-meta">
                            תרגיל מבנק המאמנים
                          </div>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleCopyExercise(exercise);
                            }}
                            disabled={copying === exercise.exerciseId || copiedExercises.has(exercise.exerciseId)}
                            className={`copy-exercise-btn ${copiedExercises.has(exercise.exerciseId) ? 'copied' : ''}`}
                          >
                            {copying === exercise.exerciseId ? (
                              <>
                                <span className="loading-spinner-small"></span>
                                מעתיק...
                              </>
                            ) : copiedExercises.has(exercise.exerciseId) ? (
                              <>
                                ✅ הועתק
                              </>
                            ) : (
                              <>
                                📋 העתק תרגיל
                              </>
                            )}
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>

      {/* Edit Exercise Modal */}
      {editingExercise && (
        <ExerciseEditModal
          exercise={editingExercise}
          onSave={handleCopyWithEdits}
          onCancel={handleCancelEdit}
          isLoading={copying === editingExercise.exerciseId}
        />
      )}
    </Modal>
  );
};

// Exercise Edit Modal Component
interface ExerciseEditModalProps {
  exercise: Exercise;
  onSave: (exerciseData: Omit<Exercise, 'exerciseId' | 'coachId' | 'createdAt'>) => void;
  onCancel: () => void;
  isLoading: boolean;
}

const ExerciseEditModal: React.FC<ExerciseEditModalProps> = ({ exercise, onSave, onCancel, isLoading }) => {
  const [formData, setFormData] = useState({
    name: exercise.name,
    muscleGroup: exercise.muscleGroup,
    note: exercise.note || '',
    link: exercise.link || ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  const handleChange = (field: keyof typeof formData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Modal isOpen={true} onClose={onCancel} title="עריכת תרגיל לפני העתקה">
      <form onSubmit={handleSubmit} className="exercise-edit-form">
        <div className="form-group">
          <label htmlFor="exercise-name">שם התרגיל *</label>
          <input
            id="exercise-name"
            type="text"
            value={formData.name}
            onChange={(e) => handleChange('name', e.target.value)}
            required
            dir="rtl"
          />
        </div>

        <div className="form-group">
          <label htmlFor="muscle-group">קבוצת שרירים *</label>
          <input
            id="muscle-group"
            type="text"
            value={formData.muscleGroup}
            onChange={(e) => handleChange('muscleGroup', e.target.value)}
            required
            dir="rtl"
          />
        </div>

        <div className="form-group">
          <label htmlFor="exercise-note">הערות</label>
          <textarea
            id="exercise-note"
            value={formData.note}
            onChange={(e) => handleChange('note', e.target.value)}
            rows={3}
            dir="rtl"
          />
        </div>

        <div className="form-group">
          <label htmlFor="exercise-link">קישור לסרטון</label>
          <input
            id="exercise-link"
            type="url"
            value={formData.link}
            onChange={(e) => handleChange('link', e.target.value)}
            dir="ltr"
          />
        </div>

        <div className="modal-actions">
          <button type="button" onClick={onCancel} className="btn-secondary">
            ביטול
          </button>
          <button 
            type="submit" 
            className="btn-primary"
            disabled={isLoading || !formData.name.trim() || !formData.muscleGroup.trim()}
          >
            {isLoading ? (
              <>
                <span className="loading-spinner-small"></span>
                מעתיק...
              </>
            ) : (
              'העתק עם השינויים'
            )}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default AdminExerciseBank;
