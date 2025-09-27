import React, { useState } from 'react';
import { Exercise } from '../services/cachedApiService';
import Modal from './Modal';
import './ExerciseParameterModal.css';

interface ExerciseParameterModalProps {
  isOpen: boolean;
  onClose: () => void;
  exercise: Exercise | null;
  onSave: (parameters: ExerciseParameters) => void;
  initialParameters?: ExerciseParameters;
}

export interface ExerciseParameters {
  numberOfSets: number;
  minimumTimeToRest: number;
  maximumTimeToRest: number;
  minimumNumberOfRepeasts: number;
  maximumNumberOfRepeasts: number;
  prescriptionNote: string;
}

const ExerciseParameterModal: React.FC<ExerciseParameterModalProps> = ({
  isOpen,
  onClose,
  exercise,
  onSave,
  initialParameters
}) => {
  const [parameters, setParameters] = useState<ExerciseParameters>({
    numberOfSets: initialParameters?.numberOfSets || 3,
    minimumTimeToRest: initialParameters?.minimumTimeToRest || 60,
    maximumTimeToRest: initialParameters?.maximumTimeToRest || 120,
    minimumNumberOfRepeasts: initialParameters?.minimumNumberOfRepeasts || 8,
    maximumNumberOfRepeasts: initialParameters?.maximumNumberOfRepeasts || 12,
    prescriptionNote: initialParameters?.prescriptionNote || ''
  });

  const handleSave = () => {
    onSave(parameters);
    onClose();
  };

  const handleCancel = () => {
    // Reset to initial parameters
    if (initialParameters) {
      setParameters(initialParameters);
    } else {
      setParameters({
        numberOfSets: 3,
        minimumTimeToRest: 60,
        maximumTimeToRest: 120,
        minimumNumberOfRepeasts: 8,
        maximumNumberOfRepeasts: 12,
        prescriptionNote: ''
      });
    }
    onClose();
  };

  if (!exercise) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleCancel}
      title="הגדרת פרמטרי תרגיל"
      icon="⚙️"
      size="md"
    >
      <div className="exercise-parameter-modal">
        <div className="exercise-info-header">
          <h4>{exercise.name}</h4>
          <p className="exercise-muscle-group">🎯 {exercise.muscleGroup}</p>
          {exercise.note && (
            <div className="exercise-description">
              <p>{exercise.note}</p>
            </div>
          )}
          {exercise.link && (
            <div className="exercise-link">
              <a 
                href={exercise.link} 
                target="_blank" 
                rel="noopener noreferrer"
                className="video-link"
              >
                🎥 צפה בסרטון
              </a>
            </div>
          )}
        </div>

        <div className="parameters-form">
          <div className="form-row">
            <div className="form-group">
              <label>מספר סטים *</label>
              <input
                type="number"
                min="1"
                max="10"
                value={parameters.numberOfSets}
                onChange={(e) => setParameters(prev => ({ 
                  ...prev, 
                  numberOfSets: parseInt(e.target.value) || 1 
                }))}
                required
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>מינימום חזרות *</label>
              <input
                type="number"
                min="1"
                max="50"
                value={parameters.minimumNumberOfRepeasts}
                onChange={(e) => setParameters(prev => ({ 
                  ...prev, 
                  minimumNumberOfRepeasts: parseInt(e.target.value) || 1 
                }))}
                required
              />
            </div>
            <div className="form-group">
              <label>מקסימום חזרות *</label>
              <input
                type="number"
                min="1"
                max="50"
                value={parameters.maximumNumberOfRepeasts}
                onChange={(e) => setParameters(prev => ({ 
                  ...prev, 
                  maximumNumberOfRepeasts: parseInt(e.target.value) || 1 
                }))}
                required
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>מינימום זמן מנוחה (שניות) *</label>
              <input
                type="number"
                min="10"
                max="600"
                step="5"
                value={parameters.minimumTimeToRest}
                onChange={(e) => setParameters(prev => ({ 
                  ...prev, 
                  minimumTimeToRest: parseInt(e.target.value) || 10 
                }))}
                required
              />
            </div>
            <div className="form-group">
              <label>מקסימום זמן מנוחה (שניות) *</label>
              <input
                type="number"
                min="10"
                max="600"
                step="5"
                value={parameters.maximumTimeToRest}
                onChange={(e) => setParameters(prev => ({ 
                  ...prev, 
                  maximumTimeToRest: parseInt(e.target.value) || 10 
                }))}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label>הוראות נוספות לאימון</label>
            <textarea
              value={parameters.prescriptionNote}
              onChange={(e) => setParameters(prev => ({ ...prev, prescriptionNote: e.target.value }))}
              placeholder="הוראות מיוחדות לתרגיל זה באימון..."
              rows={3}
              dir="rtl"
            />
          </div>
        </div>

        <div className="modal-actions">
          <button
            type="button"
            onClick={handleCancel}
            className="btn-secondary"
          >
            ביטול
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="btn-primary"
          >
            <span className="btn-icon">💾</span>
            שמור
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default ExerciseParameterModal;
