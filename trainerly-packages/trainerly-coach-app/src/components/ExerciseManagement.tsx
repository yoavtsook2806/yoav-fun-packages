import React, { useState, useEffect } from 'react';
import { cachedApiService, Exercise, Coach } from '../services/cachedApiService';
import { showError, showSuccess } from 'trainerly-ui-components';
import AdminExerciseBank from './AdminExerciseBank';
import { Card, Modal, ExerciseGroupView } from 'trainerly-ui-components';
import { MuscleGroupSelect, MUSCLE_GROUPS } from 'trainerly-ui-components';
import './ExerciseManagement.css';
import './ExerciseGroupView.css';

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
  const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set());

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
      const result = await cachedApiService.getExercises(coachId, token, { backgroundUpdate: true });
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

  const toggleCardExpansion = (exerciseId: string) => {
    const newExpandedCards = new Set(expandedCards);
    if (expandedCards.has(exerciseId)) {
      newExpandedCards.delete(exerciseId);
    } else {
      newExpandedCards.add(exerciseId);
    }
    setExpandedCards(newExpandedCards);
  };

  const renderExerciseCard = (exercise: Exercise) => {
    return (
      <Card 
        key={exercise.exerciseId} 
        data-id={exercise.exerciseId}
        variant="simple"
        title={exercise.name}
        label={exercise.muscleGroup}
        labelColor="purple"
        onEdit={() => handleEdit(exercise)}
      />
    );
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
    <div className="exercise-management-content">
      <div className="management-actions">
        <button
          onClick={() => setShowAddForm(true)}
          className="btn-primary"
          disabled={loading}
        >
          <span className="btn-icon">➕</span>
          הוסף תרגיל חדש
        </button>
        {!coach.isAdmin && (
          <button
            onClick={() => setShowAdminBank(true)}
            className="btn-secondary"
            disabled={loading}
          >
            <span className="btn-icon">🏦</span>
            בנק תרגילים מנהל
          </button>
        )}
      </div>

      {error && (
        <div className="error-message">
          <span className="error-icon">⚠️</span>
          {error}
        </div>
      )}

      <Modal
        isOpen={showAddForm}
        onClose={resetForm}
        title={editingExercise ? 'עריכת תרגיל' : 'הוספת תרגיל חדש'}
        size="lg"
      >
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
              <MuscleGroupSelect
                value={formData.muscleGroup}
                onChange={(value) => setFormData(prev => ({ ...prev, muscleGroup: value }))}
                required
                placeholder="בחר קבוצת שרירים..."
              />
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

          <div className="button-group justify-end">
            <button
              type="submit"
              className="btn-primary"
              disabled={loading || !formData.name.trim() || !formData.muscleGroup.trim()}
            >
              <span className="btn-icon">{loading ? '⏳' : editingExercise ? '✏️' : '➕'}</span>
              {loading ? 'שומר...' : editingExercise ? 'עדכן תרגיל' : 'הוסף תרגיל'}
            </button>
          </div>
        </form>
      </Modal>

      {exercises.length === 0 ? (
        <div className="exercises-grid">
          <Card>
            <div className="empty-state">
              <div className="empty-icon">💪</div>
              <h3>אין תרגילים עדיין</h3>
              <p>התחל בהוספת התרגיל הראשון שלך</p>
              <button onClick={() => setShowAddForm(true)} className="btn-primary">
                הוסף תרגיל ראשון
              </button>
            </div>
          </Card>
        </div>
      ) : (
        <ExerciseGroupView
          exercises={exercises}
          renderExerciseCard={renderExerciseCard}
        />
      )}

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
