import React, { useState } from 'react';

interface TrainingSelectionProps {
  onSelectTraining: (trainingType: string) => void;
  availableTrainings: string[];
}

const TrainingSelection: React.FC<TrainingSelectionProps> = ({
  onSelectTraining,
  availableTrainings,
}) => {
  const [selectedTraining, setSelectedTraining] = useState<string>('');

  const handleStartTraining = () => {
    if (selectedTraining) {
      onSelectTraining(selectedTraining);
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

      <button
        className="green-button"
        onClick={handleStartTraining}
        disabled={!selectedTraining}
        style={{ padding: '15px 30px', fontSize: '18px', marginTop: '20px' }}
      >
        התחל אימון
      </button>
    </div>
  );
};

export default TrainingSelection;
