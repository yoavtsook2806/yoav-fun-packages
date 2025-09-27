import React, { useState, useEffect } from 'react';
import { cachedApiService, Exercise } from '../services/cachedApiService';
import { showError, showSuccess, LoadingSpinner } from 'trainerly-ui-components';
import { Modal, ExerciseGroupView } from 'trainerly-ui-components';
import { MuscleGroupSelect } from 'trainerly-ui-components';
import './AdminExerciseBank.css';
import './Card.css';
import './ExerciseGroupView.css';

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
  const [muscleGroupFilter, setMuscleGroupFilter] = useState<string>('');
  const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set());
  const [editingExercise, setEditingExercise] = useState<Exercise | null>(null);
  const [copiedExercises, setCopiedExercises] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (isOpen) {
      loadAdminExercises();
    }
  }, [isOpen, coachId]);

  // Load copied exercises when admin exercises are loaded
  useEffect(() => {
    if (isOpen) {
      loadCopiedExercises();
    }
  }, [isOpen, coachId]);

  // Listen for cache updates
  useEffect(() => {
    const handleCacheUpdate = (event: CustomEvent) => {
      const { cacheKey, data, coachId: eventCoachId } = event.detail;
      if (cacheKey === 'admin_exercises') {
        console.log('🔄 Admin exercises updated from background sync');
        setAdminExercises(data);
      }
      // Listen for coach exercises updates to refresh copied exercises
      if (cacheKey === 'exercises' && eventCoachId === coachId) {
        const coachExercises = data;
        const copiedAdminExerciseIds = coachExercises
          .filter((exercise: Exercise) => exercise.originalExerciseId)
          .map((exercise: Exercise) => exercise.originalExerciseId!);
        
        setCopiedExercises(new Set(copiedAdminExerciseIds));
        
        // Update localStorage
        if (copiedAdminExerciseIds.length > 0) {
          localStorage.setItem(`copied_admin_exercises_${coachId}`, JSON.stringify(copiedAdminExerciseIds));
        }
      }
    };

    window.addEventListener('cacheUpdated', handleCacheUpdate as EventListener);
    
    return () => {
      window.removeEventListener('cacheUpdated', handleCacheUpdate as EventListener);
    };
  }, [coachId]);

  const loadAdminExercises = async () => {
    try {
      const result = await cachedApiService.getAdminExercises(token, { backgroundUpdate: true });
      setAdminExercises(result.data);
      
      
      // Only show loading if data didn't come from cache
      if (!result.fromCache) {
        setLoading(true);
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'שגיאה בטעינת בנק התרגילים';
      showError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const loadCopiedExercises = async () => {
    try {
      // CONSISTENT DATA FLOW: Load from cache first, then background update from server
      const coachExercisesResult = await cachedApiService.getExercises(coachId, token, { backgroundUpdate: true });
      const coachExercises = coachExercisesResult.data;
      
      // SIMPLE LOGIC: Find all originalExerciseId values from coach exercises
      // These are the admin exercise IDs that should show as "copied"
      const copiedAdminExerciseIds = coachExercises
        .filter(exercise => exercise.originalExerciseId) // Has originalExerciseId
        .map(exercise => exercise.originalExerciseId!); // Get the admin exercise ID
      
      
      setCopiedExercises(new Set(copiedAdminExerciseIds));
      
      // Also save to localStorage for immediate feedback on future loads
      if (copiedAdminExerciseIds.length > 0) {
        localStorage.setItem(`copied_admin_exercises_${coachId}`, JSON.stringify(copiedAdminExerciseIds));
      }
    } catch (error) {
      console.error('❌ Failed to load copied exercises:', error);
      // Fallback to localStorage only
      try {
        const stored = localStorage.getItem(`copied_admin_exercises_${coachId}`);
        if (stored) {
          const copiedIds = JSON.parse(stored);
          setCopiedExercises(new Set(copiedIds));
        }
      } catch (fallbackError) {
        console.error('❌ Failed to load from localStorage fallback:', fallbackError);
      }
    }
  };

  const handleCopyExercise = (adminExercise: Exercise) => {
    // Open edit modal instead of copying directly
    setEditingExercise(adminExercise);
  };

  const handleCopyWithEdits = async (exerciseData: Omit<Exercise, 'exerciseId' | 'coachId' | 'createdAt'>) => {
    if (!editingExercise) return;

    try {
      console.log('🚀 Starting copy operation for exercise:', editingExercise.exerciseId);
      setCopying(editingExercise.exerciseId);
      
      const copiedExercise = await cachedApiService.copyAdminExercise(
        coachId, 
        editingExercise.exerciseId, 
        token,
        exerciseData
      );

      console.log('✅ Copy operation completed:', copiedExercise);
      showSuccess(`תרגיל "${exerciseData.name}" הועתק בהצלחה!`);

      // Mark admin exercise as copied (immediate UI feedback)
      const newCopiedExercises = new Set([...copiedExercises, editingExercise.exerciseId]);
      setCopiedExercises(newCopiedExercises);
      
      
      // Persist to localStorage for immediate feedback on future loads
      try {
        localStorage.setItem(`copied_admin_exercises_${coachId}`, JSON.stringify([...newCopiedExercises]));
      } catch (storageError) {
        console.warn('Failed to persist copied exercises to localStorage:', storageError);
      }

      // The cache update listener will automatically refresh copied exercises when server data comes back

      if (onExerciseCopied) {
        onExerciseCopied(copiedExercise);
      }

      // Close edit modal
      setEditingExercise(null);
    } catch (err) {
      console.error('❌ Copy operation failed:', err);
      const errorMsg = err instanceof Error ? err.message : 'שגיאה בהעתקת התרגיל';
      showError(errorMsg);
    } finally {
      setCopying(null);
    }
  };

  const handleCancelEdit = () => {
    setEditingExercise(null);
  };

  const renderExerciseCard = (exercise: Exercise) => {
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
              onClick={(e) => {
                e.stopPropagation();
                handleCopyExercise(exercise);
              }}
              disabled={copying === exercise.exerciseId || copiedExercises.has(exercise.exerciseId)}
              className={`copy-exercise-btn-compact ${copiedExercises.has(exercise.exerciseId) ? 'copied' : ''}`}
              title={copiedExercises.has(exercise.exerciseId) ? 'תרגיל הועתק' : 'העתק תרגיל'}
            >
              {copying === exercise.exerciseId ? (
                <>
                  <span className="loading-spinner-small"></span>
                  <span>מעתיק</span>
                </>
              ) : copiedExercises.has(exercise.exerciseId) ? (
                <>
                  <span>✅</span>
                  <span>הועתק</span>
                </>
              ) : (
                <>
                  <span>📄</span>
                  <span>העתק</span>
                </>
              )}
            </button>
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
          </div>
        )}
      </div>
    );
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

  const filteredExercises = adminExercises
    .filter(exercise => {
      // Filter by search term (name or muscle group)
      const matchesSearch = !searchTerm || 
        exercise.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (exercise.muscleGroup && exercise.muscleGroup.toLowerCase().includes(searchTerm.toLowerCase()));
      
      // Filter by muscle group
      const matchesMuscleGroup = !muscleGroupFilter || exercise.muscleGroup === muscleGroupFilter;
      
      return matchesSearch && matchesMuscleGroup;
    })
    .sort((a, b) => {
      // Sort copied exercises to the end
      const aIsCopied = copiedExercises.has(a.exerciseId);
      const bIsCopied = copiedExercises.has(b.exerciseId);
      
      if (aIsCopied && !bIsCopied) return 1;  // a goes to end
      if (!aIsCopied && bIsCopied) return -1; // b goes to end
      
      // If both are copied or both are not copied, sort alphabetically
      return a.name.localeCompare(b.name, 'he');
    });

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="בנק התרגילים"
      size="xl"
    >
      <div className="search-section">
        <div className="search-filters">
          <input
            type="text"
            placeholder="חפש תרגיל..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
            dir="rtl"
          />
          <div className="muscle-group-filter">
            <MuscleGroupSelect
              value={muscleGroupFilter}
              onChange={setMuscleGroupFilter}
              placeholder="סנן לפי קבוצת שרירים..."
              className="filter-select"
            />
          </div>
          {(searchTerm || muscleGroupFilter) && (
            <button
              type="button"
              onClick={() => {
                setSearchTerm('');
                setMuscleGroupFilter('');
              }}
              className="clear-filters-btn"
              title="נקה מסננים"
            >
              ✕
            </button>
          )}
        </div>
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
              <ExerciseGroupView
                exercises={filteredExercises}
                renderExerciseCard={renderExerciseCard}
              />
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
          <MuscleGroupSelect
            id="muscle-group"
            value={formData.muscleGroup}
            onChange={(value) => handleChange('muscleGroup', value)}
            required
            placeholder="בחר קבוצת שרירים..."
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
