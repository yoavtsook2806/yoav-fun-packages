import React, { useState } from 'react';

interface TrainingSelectionProps {
  onSelectTraining: (trainingType: string, restTime: number) => void;
  availableTrainings: string[];
}

const TrainingSelection: React.FC<TrainingSelectionProps> = ({
  onSelectTraining,
  availableTrainings,
}) => {
  const [selectedTraining, setSelectedTraining] = useState<string>('');
  const [restTime, setRestTime] = useState<number>(60);

  const handleStartTraining = () => {
    if (selectedTraining && restTime > 0) {
      onSelectTraining(selectedTraining, restTime);
    }
  };

  return (
    <div className="training-selection">
      <h1>קדי לא פראייר</h1>
      
      <div className="training-buttons">
        {availableTrainings.map((training) => (
          <button
            key={training}
            className={`training-button ${selectedTraining === training ? 'selected' : ''}`}
            onClick={() => setSelectedTraining(training)}
          >
            אימון {training}
          </button>
        ))}
      </div>

      <div className="rest-time-input">
        <label htmlFor="rest-time">זמן מנוחה</label>
        <input
          id="rest-time"
          inputMode="numeric"
          type="number"
          value={restTime}
          onChange={(e) => setRestTime(Number(e.target.value))}
          min="10"
          max="300"
        />
      </div>

      <button
        className="green-button"
        onClick={handleStartTraining}
        disabled={!selectedTraining || restTime <= 0}
        style={{ padding: '15px 30px', fontSize: '18px', marginTop: '20px' }}
      >
        התחל אימון
      </button>
    </div>
  );
};

export default TrainingSelection;
