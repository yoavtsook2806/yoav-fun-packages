import React, { useState, useEffect } from 'react';
import { cachedApiService, Exercise, Coach } from '../services/cachedApiService';
import { showError, showSuccess } from './ToastContainer';
import AdminExerciseBank from './AdminExerciseBank';
import { MUSCLE_GROUPS } from '../constants/muscleGroups';
import './ExerciseManagement.css';

interface ExerciseManagementProps {
  coachId: string;
  token: string;
  coach: Coach; // Add coach prop to check if admin
  onBack: () => void;
}

const ExerciseManagement: React.FC<ExerciseManagementProps> = ({ coachId, token, coach, onBack }) => {
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingExercise, setEditingExercise] = useState<Exercise | null>(null);
  const [showAdminBank, setShowAdminBank] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    muscleGroup: '',
    note: '',
    link: ''
  });

  useEffect(() => {
    loadExercises();

    // Listen for cache updates
    const handleCacheUpdate = (event: CustomEvent) => {
      const { cacheKey, coachId: updatedCoachId, data } = event.detail;
      if (updatedCoachId === coachId && cacheKey === 'exercises') {
        console.log('🔄 Exercises updated from background sync');
        setExercises(data);
      }
    };

    window.addEventListener('cacheUpdated', handleCacheUpdate as EventListener);
    
    return () => {
      window.removeEventListener('cacheUpdated', handleCacheUpdate as EventListener);
    };
  }, [coachId]);

  const loadExercises = async () => {
    try {
      const result = await cachedApiService.getExercises(coachId, token);
      setExercises(result.data);
      
      // Only show loading if data didn't come from cache
      if (!result.fromCache) {
        setLoading(true);
      }
      
      setError(null);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load exercises';
      setError(errorMessage);
      showError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      
      if (editingExercise) {
        // Update existing exercise
        await cachedApiService.updateExercise(coachId, editingExercise.exerciseId, token, formData);
      } else {
        // Create new exercise
        await cachedApiService.createExercise(coachId, token, formData);
      }
      
      await loadExercises();
      resetForm();
      setError(null);
      showSuccess(editingExercise ? 'תרגיל עודכן בהצלחה!' : 'תרגיל חדש נוסף בהצלחה!');
    } catch (err) {
      console.error('Error saving exercise:', err);
      if (err instanceof Error) {
        // Check if it's a duplicate name error
        if (err.message.includes('Exercise with this name already exists')) {
          showError('תרגיל עם השם הזה כבר קיים. אנא בחר שם אחר.');
        } else {
          showError(err.message);
        }
      } else {
        showError('Failed to save exercise');
      }
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      muscleGroup: '',
      note: '',
      link: ''
    });
    setShowAddForm(false);
    setEditingExercise(null);
  };

  const handleEdit = (exercise: Exercise) => {
    setFormData({
      name: exercise.name,
      muscleGroup: exercise.muscleGroup || '',
      note: exercise.note || '',
      link: exercise.link || ''
    });
    setEditingExercise(exercise);
    setShowAddForm(true);
  };



  if (loading && exercises.length === 0) {
    return (
      <div className="exercise-management">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>טוען תרגילים...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="exercise-management" dir="rtl">
      <div className="management-header">
        <button onClick={onBack} className="back-button">
          ← חזרה לדשבורד
        </button>
        <div className="header-content">
          <h1 className="page-title">
            <span className="title-icon">💪</span>
            ניהול תרגילים
          </h1>
          <div className="header-actions">
            {!coach.isAdmin && (
              <button 
                onClick={() => setShowAdminBank(true)} 
                className="admin-bank-button"
                disabled={loading}
              >
                <span className="button-icon">🏦</span>
                בנק התרגילים
              </button>
            )}
            <button 
              onClick={() => setShowAddForm(true)} 
              className="add-button"
              disabled={loading}
            >
              <span className="button-icon">➕</span>
              הוסף תרגיל חדש
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div className="error-message">
          <span className="error-icon">⚠️</span>
          {error}
        </div>
      )}

      {showAddForm && (
        <div className="modal-overlay">
          <div className="exercise-form-modal">
            <div className="modal-header">
              <h2>{editingExercise ? 'עריכת תרגיל' : 'הוספת תרגיל חדש'}</h2>
              <button onClick={resetForm} className="close-button">✕</button>
            </div>
            
            <form onSubmit={handleSubmit} className="exercise-form">
              <div className="form-row">
                <div className="form-group">
                  <label>שם התרגיל *</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    required
                    placeholder="לדוגמה: סקוואט"
                  />
                </div>
                <div className="form-group">
                  <label>קבוצת שרירים *</label>
                  <select
                    value={formData.muscleGroup}
                    onChange={(e) => setFormData(prev => ({ ...prev, muscleGroup: e.target.value }))}
                    required
                  >
                    <option value="">בחר קבוצת שרירים...</option>
                    {MUSCLE_GROUPS.map((group) => (
                      <option key={group} value={group}>
                        {group}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label>הוראות ביצוע</label>
                <textarea
                  value={formData.note}
                  onChange={(e) => setFormData(prev => ({ ...prev, note: e.target.value }))}
                  placeholder="הוראות מפורטות לביצוע התרגיל"
                  rows={4}
                />
              </div>

              <div className="form-group">
                <label>קישור לסרטון</label>
                <input
                  type="url"
                  value={formData.link}
                  onChange={(e) => setFormData(prev => ({ ...prev, link: e.target.value }))}
                  placeholder="https://youtube.com/watch?v=..."
                />
              </div>


              <div className="form-actions">
                <button type="button" onClick={resetForm} className="cancel-button">
                  ביטול
                </button>
                <button type="submit" className="save-button" disabled={loading || !formData.name.trim() || !formData.muscleGroup.trim()}>
                  {loading ? 'שומר...' : editingExercise ? 'עדכן תרגיל' : 'הוסף תרגיל'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="exercises-grid">
        {exercises.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">💪</div>
            <h3>אין תרגילים עדיין</h3>
            <p>התחל בהוספת התרגיל הראשון שלך</p>
            <button onClick={() => setShowAddForm(true)} className="empty-action-button">
              הוסף תרגיל ראשון
            </button>
          </div>
        ) : (
          exercises.map((exercise) => (
            <div key={exercise.exerciseId} data-exercise-id={exercise.exerciseId} className="exercise-card">
              <div className="exercise-header">
                <h3 className="exercise-name">{exercise.name}</h3>
                <div className="exercise-actions">
                  <button onClick={() => handleEdit(exercise)} className="edit-button">
                    ✏️
                  </button>
                </div>
              </div>
              
              {exercise.muscleGroup && (
                <p className="exercise-muscle-group">🎯 {exercise.muscleGroup}</p>
              )}
              
              {exercise.note && (
                <p className="exercise-instructions">{exercise.note}</p>
              )}
              
              
              {exercise.link && (
                <div className="exercise-video">
                  <a href={exercise.link} target="_blank" rel="noopener noreferrer" className="video-link">
                    🎥 צפה בסרטון
                  </a>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Admin Exercise Bank Modal */}
      <AdminExerciseBank
        coachId={coachId}
        token={token}
        isOpen={showAdminBank}
        onClose={() => setShowAdminBank(false)}
        onExerciseCopied={(exercise) => {
          // Refresh exercises after copying
          loadExercises();
        }}
      />
    </div>
  );
};

export default ExerciseManagement;
